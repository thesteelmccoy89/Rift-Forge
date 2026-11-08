import { describe, expect, it } from "vitest";
import { collectionTotals, exportCollection, importCollection, missingForDeck, setOwned } from "./collection";
import type { Card, CardPool, Deck } from "./types";

const c = (id: string, name: string): Card =>
  ({ id, name, type: "Unit", domains: ["Fury"], energy: 1, power: 0, might: 1, text: "", tag: null, signature: false });
const pool: CardPool = {
  source: { name: "test", placeholder: true },
  legends: [],
  cards: [c("a", "Alpha"), c("b", "Bravo"), c("ch", "Champ")],
  battlefields: [],
};
const deck: Deck = { name: "t", legendId: "L", championId: "ch", main: { a: 3, b: 2 }, runes: {}, battlefields: [] };

describe("collection", () => {
  it("sets and clears owned counts", () => {
    expect(setOwned({}, "a", 2)).toEqual({ a: 2 });
    expect(setOwned({ a: 2 }, "a", 0)).toEqual({});
    expect(setOwned({}, "a", -3)).toEqual({});
  });

  it("lists what a deck still needs, counting the Chosen Champion", () => {
    expect(missingForDeck(deck, { a: 1, b: 2 })).toEqual([
      { id: "a", need: 3, have: 1, missing: 2 },
      { id: "ch", need: 1, have: 0, missing: 1 },
    ]);
    expect(missingForDeck(deck, { a: 3, b: 5, ch: 1 })).toEqual([]);
  });

  it("totals only cards in the pool", () => {
    expect(collectionTotals({ a: 2, b: 1, gone: 4 }, pool)).toEqual({ unique: 2, copies: 3, poolSize: 3 });
  });

  it("round-trips through text", () => {
    const text = exportCollection({ b: 1, a: 3 }, pool);
    expect(text).toBe("3 Alpha\n1 Bravo");
    expect(importCollection(text, pool).collection).toEqual({ a: 3, b: 1 });
  });

  it("accepts 3x, bare names, ids, and reports unknown lines", () => {
    const { collection, unknown } = importCollection("3x alpha\nBravo\n2 ch\n# note\n1 Nope", pool);
    expect(collection).toEqual({ a: 3, b: 1, ch: 2 });
    expect(unknown).toEqual(["1 Nope"]);
  });
});
