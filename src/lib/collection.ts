import type { Card, CardPool, Deck } from "./types";

/** card id -> copies owned */
export type Collection = Record<string, number>;

export const COLLECTION_KEY = "riftforge.collection";

export function setOwned(col: Collection, id: string, qty: number): Collection {
  const next = { ...col };
  const n = Math.max(0, Math.floor(qty) || 0);
  if (n) next[id] = n;
  else delete next[id];
  return next;
}

/** Copies of each card the deck uses, including the Chosen Champion. */
export function deckNeeds(deck: Deck): Record<string, number> {
  const needs: Record<string, number> = {};
  for (const [id, n] of Object.entries(deck.main)) if (n > 0) needs[id] = n;
  if (deck.championId) needs[deck.championId] = (needs[deck.championId] ?? 0) + 1;
  return needs;
}

export interface MissingCard {
  id: string;
  need: number;
  have: number;
  missing: number;
}

/** Cards the deck needs that the collection does not cover. */
export function missingForDeck(deck: Deck, col: Collection): MissingCard[] {
  return Object.entries(deckNeeds(deck))
    .map(([id, need]) => {
      const have = col[id] ?? 0;
      return { id, need, have, missing: Math.max(0, need - have) };
    })
    .filter((m) => m.missing > 0);
}

export function collectionTotals(col: Collection, pool: CardPool) {
  const ids = new Set(pool.cards.map((c) => c.id));
  let unique = 0;
  let copies = 0;
  for (const [id, n] of Object.entries(col)) {
    if (!ids.has(id) || n <= 0) continue;
    unique++;
    copies += n;
  }
  return { unique, copies, poolSize: pool.cards.length };
}

/** One "qty Card Name" line per owned card, sorted by name. */
export function exportCollection(col: Collection, pool: CardPool): string {
  return pool.cards
    .filter((c) => (col[c.id] ?? 0) > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => `${col[c.id]} ${c.name}`)
    .join("\n");
}

/**
 * Reads lines like "3 Card Name", "3x Card Name", or "Card Name" (1 copy).
 * A line may use the card id instead of the name. Unknown lines are returned
 * so the UI can report them.
 */
export function importCollection(text: string, pool: CardPool): { collection: Collection; unknown: string[] } {
  const byName = new Map<string, Card>();
  for (const c of pool.cards) byName.set(c.name.toLowerCase(), c);
  const byId = new Map(pool.cards.map((c) => [c.id.toLowerCase(), c]));
  const collection: Collection = {};
  const unknown: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^(\d+)\s*x?\s+(.+)$/i);
    const qty = m ? Number(m[1]) : 1;
    const key = (m ? m[2] : line).trim().toLowerCase();
    const card = byName.get(key) ?? byId.get(key);
    if (!card) {
      unknown.push(line);
      continue;
    }
    collection[card.id] = (collection[card.id] ?? 0) + qty;
  }
  return { collection, unknown };
}

export function loadCollection(): Collection {
  try {
    const raw = JSON.parse(localStorage.getItem(COLLECTION_KEY) ?? "{}");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const col: Collection = {};
    for (const [id, n] of Object.entries(raw)) if (typeof n === "number" && n > 0) col[id] = Math.floor(n);
    return col;
  } catch {
    return {};
  }
}

export function saveCollection(col: Collection): boolean {
  try {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(col));
    return true;
  } catch {
    return false;
  }
}
