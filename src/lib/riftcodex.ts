/**
 * Maps the Riftcodex open API (https://riftcodex.com, unofficial fan project, not affiliated with Riot)
 * into Rift Forge's CardPool shape. Kept pure so it can be unit tested without network access.
 */
import { DOMAINS, type Card, type CardPool, type CardType, type Domain, type Legend } from "./types";

export interface RiftcodexCard {
  id: string;
  name: string;
  riftbound_id: string;
  collector_number: number;
  attributes: { energy?: number | null; might?: number | null; power?: number | null };
  classification: { type: string; supertype?: string | null; rarity: string; domain: string[] };
  text: { rich?: string; plain?: string; flavour?: string };
  set: { set_id: string; label: string };
  media: { image_url?: string; artist?: string; accessibility_text?: string };
  tags: string[];
  metadata: { clean_name?: string; alternate_art: boolean; overnumbered: boolean; signature: boolean };
}

const PLAYABLE: Record<string, CardType> = { unit: "Unit", spell: "Spell", gear: "Gear" };
const isDomain = (d: string): d is Domain => (DOMAINS as readonly string[]).includes(d);
const lower = (s?: string | null) => (s ?? "").trim().toLowerCase();

/** Collector variants (alt art, overnumbered, signed prints) duplicate a base card. */
const isVariant = (c: RiftcodexCard) =>
  c.metadata.alternate_art || c.metadata.overnumbered || c.metadata.signature;

export function mapRiftcodex(raw: RiftcodexCard[], fetchedAt?: string): CardPool {
  // Prefer base prints; keep the first card seen for each name.
  const sorted = [...raw].sort((a, b) => Number(isVariant(a)) - Number(isVariant(b)));
  const seen = new Set<string>();
  const unique = sorted.filter((c) => {
    const key = lower(c.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const legends: Legend[] = unique
    .filter((c) => lower(c.classification.type) === "legend")
    .map((c) => ({
      id: c.riftbound_id || c.id,
      champ: c.tags[0] ?? c.name,
      title: c.name,
      domains: c.classification.domain.filter(isDomain),
      image: c.media.image_url,
    }))
    .sort((a, b) => a.champ.localeCompare(b.champ));
  const champNames = new Set(legends.map((l) => l.champ));

  const cards: Card[] = [];
  for (const c of unique) {
    const supertype = lower(c.classification.supertype);
    if (supertype === "token") continue;
    const base = PLAYABLE[lower(c.classification.type)];
    if (!base) continue;
    const isChampion = supertype === "champion" && base === "Unit";
    const signature = supertype === "signature";
    cards.push({
      id: c.riftbound_id || c.id,
      name: c.name,
      type: isChampion ? "Champion" : base,
      domains: c.classification.domain.filter(isDomain),
      energy: c.attributes.energy ?? 0,
      power: c.attributes.power ?? 0,
      might: c.attributes.might ?? null,
      text: c.text.plain ?? "",
      tag: isChampion || signature ? (c.tags.find((t) => champNames.has(t)) ?? null) : null,
      signature,
      image: c.media.image_url,
      rarity: c.classification.rarity,
      set: c.set.set_id,
    });
  }
  cards.sort((a, b) => a.energy - b.energy || a.name.localeCompare(b.name));

  const battlefields = unique
    .filter((c) => lower(c.classification.type) === "battlefield")
    .map((c) => c.name)
    .sort();

  return {
    source: { name: "Riftcodex", url: "https://riftcodex.com", fetchedAt, placeholder: false },
    legends,
    cards,
    battlefields,
  };
}
