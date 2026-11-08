import { describe, expect, it } from "vitest";
import { mapCommunityCards, type CommunityCard } from "./communityCards";

let n = 0;
const card = (p: Partial<CommunityCard> & Pick<CommunityCard, "name" | "cardType">): CommunityCard => {
  n++;
  return {
    cardCode: `rad-001-${String(n).padStart(3, "0")}`,
    cardNumber: `001-${String(n).padStart(3, "0")}`,
    rarity: "Common",
    cardSet: "Radiance",
    domains: ["Fury"],
    energy: 2,
    power: null,
    might: null,
    abilityEffective: `${p.name} text`,
    imageUrl: `https://img.example/${n}.png`,
    ...p,
  };
};

const raw: CommunityCard[] = [
  card({ name: "Jinx", subtitle: "Loose Cannon", cardType: "Legend", cardTypeLabels: ["Legend"], domains: ["Fury", "Chaos"], tags: ["Jinx"] }),
  card({ name: "Jinx", subtitle: "Rebel", cardType: "Unit", cardTypeLabels: ["Unit", "Champion"], domains: ["Chaos"], tags: ["Jinx", "Zaun"], energy: 5, might: 5, power: 1 }),
  card({ name: "Jinx", subtitle: "Rebel", cardType: "Unit", cardTypeLabels: ["Unit", "Champion"], domains: ["Chaos"], tags: ["Jinx"], rarity: "Showcase", cardNumber: "sp1-002", cardCode: "rad-sp1-002" }),
  card({ name: "Super Mega Death Rocket", cardType: "Spell", cardTypeLabels: ["Spell", "Signature"], tags: ["Jinx"], power: 1 }),
  card({ name: "Amateur Demolitionist", cardType: "Unit", cardTypeLabels: ["Unit"], domains: ["Chaos"], might: 1 }),
  card({ name: "Bomb", cardType: "Gear", cardTypeLabels: ["Gear", "Token"] }),
  card({ name: "Fury Rune", cardType: "Rune", cardTypeLabels: ["Rune", "Basic"], energy: null }),
  card({ name: "Zaun Warrens", cardType: "Battlefield", cardTypeLabels: ["Battlefield"], domains: [] }),
  card({ name: "Teemo", subtitle: "Scout", cardType: "Unit", cardTypeLabels: ["Unit", "Champion"], tags: ["Yordle", "Teemo"], might: 2 }),
  card({ name: "Swift Scout", cardType: "Legend", cardTypeLabels: ["Legend"], domains: ["Mind", "Chaos"], tags: ["Yordle", "Teemo"] }),
  card({ name: "Caitlyn", subtitle: "Patrolling", cardType: "Unit", cardTypeLabels: ["Unit", "Champion"], tags: ["Piltover"] }),
  card({ name: "Annie", subtitle: "Dark Child", fullName: "Annie, Dark Child, Starter", cardType: "Legend", cardTypeLabels: ["Legend"], domains: ["Fury", "Chaos"], tags: ["Annie"] }),
  card({ name: "Long Sword", cardType: "Gear", cardTypeLabels: ["Gear"], domains: ["Body"] }),
];
const pool = mapCommunityCards(raw, "2026-11-08T00:00:00Z");
const get = (name: string) => pool.cards.find((c) => c.name === name);

describe("mapCommunityCards", () => {
  it("turns Legend cards into legends keyed by champion tag", () => {
    expect(pool.legends.find((l) => l.champ === "Jinx")).toMatchObject({ title: "Jinx, Loose Cannon", domains: ["Fury", "Chaos"] });
  });
  it("marks champion units and prefers the base print over Showcase", () => {
    expect(pool.cards.filter((c) => c.name === "Jinx, Rebel")).toHaveLength(1);
    expect(get("Jinx, Rebel")).toMatchObject({ id: "rad-001-002", type: "Champion", tag: "Jinx", might: 5, power: 1 });
  });
  it("picks the champion tag over tribe or region tags", () => {
    expect(pool.legends.find((l) => l.title === "Swift Scout")).toMatchObject({ champ: "Teemo" });
    expect(get("Teemo, Scout")).toMatchObject({ tag: "Teemo" });
  });
  it("tags champion units even when their champion has no legend", () => {
    expect(get("Caitlyn, Patrolling")).toMatchObject({ type: "Champion", tag: "Caitlyn" });
  });
  it("drops the Starter suffix from starter-deck reprints", () => {
    expect(pool.legends.map((l) => l.title)).toContain("Annie, Dark Child");
  });
  it("marks Signature cards with their champion", () => {
    expect(get("Super Mega Death Rocket")).toMatchObject({ signature: true, tag: "Jinx", type: "Spell" });
  });
  it("turns missing stats into zero energy and power", () => {
    expect(get("Amateur Demolitionist")).toMatchObject({ energy: 2, power: 0, might: 1, tag: null });
  });
  it("leaves tokens, runes, legends and battlefields out of the card pool", () => {
    expect(pool.cards.map((c) => c.name).sort()).toEqual(
      ["Amateur Demolitionist", "Caitlyn, Patrolling", "Jinx, Rebel", "Long Sword", "Super Mega Death Rocket", "Teemo, Scout"],
    );
    expect(pool.battlefields).toEqual(["Zaun Warrens"]);
  });
  it("records where the data came from", () => {
    expect(pool.source).toMatchObject({ name: "Riftbound cards dataset", placeholder: false, fetchedAt: "2026-11-08T00:00:00Z" });
  });
});
