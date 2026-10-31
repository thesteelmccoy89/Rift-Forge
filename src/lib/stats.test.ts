import { describe, expect, it } from "vitest";
import { deckStats } from "./stats";
import type { Card, Deck } from "./types";

const c = (id: string, energy: number, type: Card["type"], domains: Card["domains"], might: number | null = null): Card =>
  ({ id, name: id, type, domains, energy, power: 0, might, text: "", tag: null, signature: false });
const cards = new Map(
  [c("a", 1, "Unit", ["Fury"], 2), c("b", 3, "Spell", ["Chaos"]), c("big", 9, "Unit", ["Fury"], 8), c("champ", 5, "Champion", ["Fury"], 5)]
    .map((x) => [x.id, x]),
);
const deck: Deck = { name: "t", legendId: "L", championId: "champ", main: { a: 3, b: 2, big: 1 }, runes: {}, battlefields: [] };

describe("deckStats", () => {
  const s = deckStats(deck, cards);
  it("counts the Chosen Champion", () => expect(s.total).toBe(7));
  it("builds the energy curve with a 7+ bucket", () => {
    expect(Object.fromEntries(s.curve.map((b) => [b.label, b.count]))).toMatchObject({ "1": 3, "3": 2, "5": 1, "7+": 1, "0": 0 });
  });
  it("splits by domain and type", () => {
    expect(s.domains).toEqual([{ domain: "Fury", count: 5 }, { domain: "Chaos", count: 2 }]);
    expect(s.types).toEqual([{ type: "Unit", count: 4 }, { type: "Champion", count: 1 }, { type: "Spell", count: 2 }]);
  });
  it("averages energy and unit might", () => {
    expect(s.averageEnergy).toBe(Math.round(((3 + 6 + 9 + 5) / 7) * 10) / 10);
    expect(s.units).toBe(5);
    expect(s.averageMight).toBe(Math.round(((6 + 8 + 5) / 5) * 10) / 10);
  });
  it("handles an empty deck", () => {
    expect(deckStats({ ...deck, main: {}, championId: null }, cards)).toMatchObject({ total: 0, averageEnergy: 0, averageMight: 0 });
  });
});
