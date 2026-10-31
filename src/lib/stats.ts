import { DOMAINS, type Card, type CardType, type Deck, type Domain } from "./types";

export const CURVE_BUCKETS = ["0", "1", "2", "3", "4", "5", "6", "7+"] as const;
const TYPES: CardType[] = ["Unit", "Champion", "Spell", "Gear"];

export interface DeckStats {
  total: number;
  curve: { label: string; count: number }[];
  domains: { domain: Domain; count: number }[];
  types: { type: CardType; count: number }[];
  averageEnergy: number;
  units: number;
  averageMight: number;
}

/** Stats for the main deck, Chosen Champion included. Multi-domain cards count once per domain. */
export function deckStats(deck: Deck, cards: Map<string, Card>): DeckStats {
  const entries: [Card, number][] = [];
  for (const [id, q] of Object.entries(deck.main)) {
    const c = cards.get(id);
    if (c && q > 0) entries.push([c, q]);
  }
  const champ = deck.championId ? cards.get(deck.championId) : undefined;
  if (champ) entries.push([champ, 1]);

  const curve = CURVE_BUCKETS.map((label) => ({ label, count: 0 }));
  const domains = new Map<Domain, number>();
  const types = new Map<CardType, number>();
  let total = 0, energy = 0, units = 0, might = 0;

  for (const [c, q] of entries) {
    total += q;
    energy += c.energy * q;
    curve[Math.min(c.energy, 7)].count += q;
    for (const d of c.domains) domains.set(d, (domains.get(d) ?? 0) + q);
    types.set(c.type, (types.get(c.type) ?? 0) + q);
    if (c.might != null) { units += q; might += c.might * q; }
  }
  const round = (n: number) => Math.round(n * 10) / 10;
  return {
    total,
    curve,
    domains: DOMAINS.filter((d) => domains.has(d)).map((domain) => ({ domain, count: domains.get(domain)! })),
    types: TYPES.filter((t) => types.has(t)).map((type) => ({ type, count: types.get(type)! })),
    averageEnergy: total ? round(energy / total) : 0,
    units,
    averageMight: units ? round(might / units) : 0,
  };
}
