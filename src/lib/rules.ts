import type { Card, CardPool, Deck, Domain, Legend } from "./types";

/**
 * Riftbound constructed deck rules, checked against Core Rules section 103
 * (main deck 103.3, copies 103.3.b, signature 103.3.d, runes 103.4, battlefields 103.5).
 */
export const RULES = {
  mainMin: 40,
  maxCopies: 3,
  maxSignature: 3,
  runes: 12,
  battlefields: 3,
} as const;

export interface Check {
  id: string;
  ok: boolean;
  label: string;
  detail: string;
}

/** Domain identity (103.2.b.1) plus Signature cards needing the legend's champion tag (103.3.d). */
export function isLegalFor(card: Card, legend: Legend): boolean {
  return (
    card.domains.every((d) => legend.domains.includes(d)) &&
    (!card.signature || card.tag === legend.champ)
  );
}

export function deckTotals(deck: Deck, cards: Map<string, Card>) {
  const mainQty =
    Object.values(deck.main).reduce((a, b) => a + b, 0) + (deck.championId ? 1 : 0);
  const signatureQty = Object.entries(deck.main)
    .filter(([id]) => cards.get(id)?.signature)
    .reduce((a, [, q]) => a + q, 0);
  const runeQty = Object.values(deck.runes).reduce((a, b) => a + (b ?? 0), 0);
  return { mainQty, signatureQty, runeQty };
}

export function checkDeck(deck: Deck, pool: CardPool): Check[] {
  const cards = new Map(pool.cards.map((c) => [c.id, c]));
  const legend = pool.legends.find((l) => l.id === deck.legendId);
  if (!legend) {
    return [{ id: "legend", ok: false, label: "Choose a Champion Legend", detail: "none" }];
  }
  const t = deckTotals(deck, cards);
  const champ = deck.championId ? cards.get(deck.championId) : undefined;

  const overCopies = Object.entries(deck.main).filter(
    ([id, q]) => q + (id === deck.championId ? 1 : 0) > RULES.maxCopies,
  );
  const offDomain = Object.keys(deck.main).filter((id) => {
    const c = cards.get(id);
    return !c || !isLegalFor(c, legend);
  });
  const badRunes = Object.entries(deck.runes).filter(
    ([d, q]) => (q ?? 0) > 0 && !legend.domains.includes(d as Domain),
  );
  const uniqueBfs = new Set(deck.battlefields);

  return [
    {
      id: "champion",
      ok: !!champ && champ.type === "Champion" && champ.tag === legend.champ,
      label: `Chosen Champion is a ${legend.champ} unit`,
      detail: champ ? champ.name : "none",
    },
    {
      id: "main-size",
      ok: t.mainQty >= RULES.mainMin,
      label: `Main deck has at least ${RULES.mainMin} cards`,
      detail: `${t.mainQty}/${RULES.mainMin}`,
    },
    {
      id: "copies",
      ok: overCopies.length === 0,
      label: `No more than ${RULES.maxCopies} copies of a card`,
      detail: overCopies.length ? `${overCopies.length} over` : "",
    },
    {
      id: "domains",
      ok: offDomain.length === 0,
      label: `All cards match ${legend.domains.join(" + ")}`,
      detail: offDomain.length ? `${offDomain.length} off` : "",
    },
    {
      id: "signature",
      ok: t.signatureQty <= RULES.maxSignature,
      label: `Up to ${RULES.maxSignature} Signature cards`,
      detail: `${t.signatureQty}/${RULES.maxSignature}`,
    },
    {
      id: "runes",
      ok: t.runeQty === RULES.runes && badRunes.length === 0,
      label: `Exactly ${RULES.runes} runes in your domains`,
      detail: `${t.runeQty}/${RULES.runes}`,
    },
    {
      id: "battlefields",
      ok: deck.battlefields.length === RULES.battlefields && uniqueBfs.size === RULES.battlefields,
      label: `${RULES.battlefields} different battlefields`,
      detail: `${uniqueBfs.size}/${RULES.battlefields}`,
    },
  ];
}

export const isDeckLegal = (deck: Deck, pool: CardPool) =>
  checkDeck(deck, pool).every((c) => c.ok);
