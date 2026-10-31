import { describe, expect, it } from "vitest";
import { samplePool } from "@/data/samplePool";
import { checkDeck, isDeckLegal, isLegalFor } from "./rules";
import { exportDeck, importDeck } from "./deckText";
import type { Deck } from "./types";

const jinx = samplePool.legends.find((l) => l.id === "L-JINX")!;
const legal = samplePool.cards.filter((c) => isLegalFor(c, jinx) && c.type !== "Champion" && !c.signature);

function legalDeck(): Deck {
  const main: Record<string, number> = {};
  legal.forEach((c) => (main[c.id] = 3)); // 16 cards x3 = 48
  main["SIG-1"] = 2;
  return {
    name: "Test",
    legendId: "L-JINX",
    championId: "CHAMP-1",
    main,
    runes: { Fury: 6, Chaos: 6 },
    battlefields: samplePool.battlefields.slice(0, 3),
  };
}
const failing = (d: Deck) => checkDeck(d, samplePool).filter((c) => !c.ok).map((c) => c.id);

describe("deck rules", () => {
  it("accepts a legal deck", () => {
    expect(failing(legalDeck())).toEqual([]);
    expect(isDeckLegal(legalDeck(), samplePool)).toBe(true);
  });
  it("requires 40 cards including the Chosen Champion", () => {
    const d = legalDeck();
    d.main = { [legal[0].id]: 3 };
    expect(failing(d)).toContain("main-size");
  });
  it("counts the Chosen Champion toward the copy limit", () => {
    const d = legalDeck();
    d.main["CHAMP-1"] = 3;
    expect(failing(d)).toContain("copies");
  });
  it("rejects cards outside the legend's domains and other champions' cards", () => {
    const d = legalDeck();
    d.main["MI-001"] = 1;
    d.main["SIG-2"] = 1; // Viktor signature
    expect(failing(d)).toContain("domains");
  });
  it("caps Signature cards at 3", () => {
    const d = legalDeck();
    d.main["SIG-1"] = 4;
    expect(failing(d)).toEqual(expect.arrayContaining(["signature", "copies"]));
  });
  it("requires exactly 12 runes in the legend's domains", () => {
    const d = legalDeck();
    d.runes = { Fury: 6, Mind: 6 };
    expect(failing(d)).toContain("runes");
  });
  it("requires 3 different battlefields", () => {
    const d = legalDeck();
    d.battlefields = ["Targon Peak", "Targon Peak", "Bandle Grove"];
    expect(failing(d)).toContain("battlefields");
  });
  it("requires a champion of the legend", () => {
    const d = legalDeck();
    d.championId = "CHAMP-3"; // Viktor
    expect(failing(d)).toContain("champion");
  });
});

describe("deck text", () => {
  it("round-trips export and import", () => {
    const d = legalDeck();
    const back = importDeck(exportDeck(d, samplePool), samplePool, { ...d, main: {}, championId: null });
    expect(back).toEqual(d);
  });
});
