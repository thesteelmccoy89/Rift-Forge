/**
 * Maps the community "riftbound-cards" dataset (https://huggingface.co/datasets/Wysme/riftbound-cards),
 * scraped from Riot's official card gallery, into Rift Forge's CardPool shape.
 * Kept pure so it can be unit tested without network access.
 */
import { DOMAINS, type Card, type CardPool, type CardType, type Domain, type Legend } from "./types";

export const DATASET_URL = "https://huggingface.co/datasets/Wysme/riftbound-cards";
export const DATASET_JSON = `${DATASET_URL}/resolve/main/cards.json`;

export interface CommunityCard {
  cardCode: string;
  name: string;
  subtitle?: string | null;
  fullName?: string | null;
  setCode?: string | null;
  cardSet?: string | null;
  cardNumber?: string | null;
  rarity?: string | null;
  domains?: string[] | null;
  cardType: string;
  cardTypeLabels?: string[] | null;
  tags?: string[] | null;
  energy?: number | null;
  power?: number | null;
  might?: number | null;
  abilityEffective?: string | null;
  abilityOriginal?: string | null;
  imageUrl?: string | null;
}

const PLAYABLE: Record<string, CardType> = { unit: "Unit", spell: "Spell", gear: "Gear" };
const isDomain = (d: string): d is Domain => (DOMAINS as readonly string[]).includes(d);
const lower = (s?: string | null) => (s ?? "").trim().toLowerCase();
const labels = (c: CommunityCard) => new Set([c.cardType, ...(c.cardTypeLabels ?? [])].map(lower));
/** Starter-deck reprints carry a ", Starter" suffix; they are the same card. */
const fullName = (c: CommunityCard) =>
  (c.fullName || (c.subtitle ? `${c.name}, ${c.subtitle}` : c.name)).replace(/,\s*Starter$/i, "");

/**
 * Showcase, alternate-art and promo prints repeat a base card. Lower rank = preferred print.
 * Base collector numbers look like "001-167"; variants use prefixes ("sp1-005") or suffixes ("r01a").
 */
function printRank(c: CommunityCard): number {
  let rank = 0;
  if (lower(c.rarity) === "showcase") rank += 2;
  if (c.cardNumber && !/^\d+-\d+$/.test(c.cardNumber)) rank += 1;
  return rank;
}

export function mapCommunityCards(raw: CommunityCard[], fetchedAt?: string): CardPool {
  const byName = new Map<string, CommunityCard>();
  for (const c of raw) {
    const key = lower(fullName(c));
    const prev = byName.get(key);
    if (!prev || printRank(c) < printRank(prev)) byName.set(key, c);
  }
  const unique = [...byName.values()];

  // Champion units are named after their champion ("Teemo, Scout" has name "Teemo"). Tags can also hold
  // regions or tribes ("Yordle"), so champion tags are matched against these names.
  const champNames = new Set(unique.filter((c) => labels(c).has("champion") && !labels(c).has("legend")).map((c) => c.name));
  const champTag = (c: CommunityCard) => (c.tags ?? []).find((t) => champNames.has(t)) ?? null;

  const legends: Legend[] = unique
    .filter((c) => labels(c).has("legend"))
    .map((c) => ({
      id: c.cardCode,
      champ: champTag(c) ?? c.tags?.[0] ?? c.name,
      title: fullName(c),
      domains: (c.domains ?? []).filter(isDomain),
      image: c.imageUrl ?? undefined,
    }))
    .sort((a, b) => a.champ.localeCompare(b.champ) || a.title.localeCompare(b.title));

  const cards: Card[] = [];
  for (const c of unique) {
    const l = labels(c);
    if (l.has("token") || l.has("legend")) continue;
    const base = PLAYABLE[lower(c.cardType)];
    if (!base) continue;
    const isChampion = base === "Unit" && l.has("champion");
    const signature = l.has("signature");
    cards.push({
      id: c.cardCode,
      name: fullName(c),
      type: isChampion ? "Champion" : base,
      domains: (c.domains ?? []).filter(isDomain),
      energy: c.energy ?? 0,
      power: c.power ?? 0,
      might: c.might ?? null,
      text: c.abilityEffective ?? c.abilityOriginal ?? "",
      tag: isChampion ? c.name : signature ? champTag(c) : null,
      signature,
      image: c.imageUrl ?? undefined,
      rarity: c.rarity ?? undefined,
      set: c.cardSet ?? c.setCode ?? undefined,
    });
  }
  cards.sort((a, b) => a.energy - b.energy || a.name.localeCompare(b.name));

  const battlefields = unique
    .filter((c) => labels(c).has("battlefield") && !labels(c).has("token"))
    .map(fullName)
    .sort();

  return {
    source: { name: "Riftbound cards dataset", url: DATASET_URL, fetchedAt, placeholder: false },
    legends,
    cards,
    battlefields,
  };
}
