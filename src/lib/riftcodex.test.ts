import { describe, expect, it } from "vitest";
import { mapRiftcodex, type RiftcodexCard } from "./riftcodex";

let n = 0;
function card(p: Partial<RiftcodexCard> & { name: string; type: string; domain: string[]; supertype?: string; tags?: string[] }): RiftcodexCard {
  n++;
  return {
    id: `rc-${n}`,
    name: p.name,
    riftbound_id: `ogn-${String(n).padStart(3, "0")}-298`,
    collector_number: n,
    attributes: p.attributes ?? { energy: 3, might: 3, power: 1 },
    classification: { type: p.type, supertype: p.supertype ?? null, rarity: "Common", domain: p.domain },
    text: { plain: `${p.name} text` },
    set: { set_id: "OGN", label: "Origins" },
    media: { image_url: `https://img.example/${n}.png` },
    tags: p.tags ?? [],
    metadata: { alternate_art: false, overnumbered: false, signature: false, ...p.metadata },
  };
}

const raw: RiftcodexCard[] = [
  card({ name: "Loose Cannon", type: "Legend", domain: ["Fury", "Chaos"], tags: ["Jinx"] }),
  card({ name: "Jinx, Rebel", type: "Unit", supertype: "Champion", domain: ["Chaos"], tags: ["Jinx", "Zaun"] }),
  card({ name: "Super Mega Death Rocket", type: "Spell", supertype: "Signature", domain: ["Fury"], tags: ["Jinx"] }),
  card({ name: "Trove Golem", type: "Unit", domain: ["Order"], tags: ["Freljord"], attributes: { energy: 8, might: 9, power: 2 } }),
  card({ name: "Trove Golem", type: "Unit", domain: ["Order"], metadata: { alternate_art: true, overnumbered: false, signature: false } }),
  card({ name: "Sprite", type: "Unit", supertype: "Token", domain: ["Calm"] }),
  card({ name: "Fury Rune", type: "Rune", domain: ["Fury"] }),
  card({ name: "Zaun Warrens", type: "Battlefield", domain: [] }),
  card({ name: "Long Sword", type: "Gear", domain: ["Body"] }),
];
const pool = mapRiftcodex(raw, "2026-10-31T00:00:00Z");
const get = (name: string) => pool.cards.find((c) => c.name === name);

describe("mapRiftcodex", () => {
  it("turns Legend cards into legends keyed by champion tag", () => {
    expect(pool.legends).toEqual([
      expect.objectContaining({ champ: "Jinx", title: "Loose Cannon", domains: ["Fury", "Chaos"] }),
    ]);
  });
  it("marks champion units and tags them with their champion", () => {
    expect(get("Jinx, Rebel")).toMatchObject({ type: "Champion", tag: "Jinx", signature: false });
  });
  it("marks Signature cards", () => {
    expect(get("Super Mega Death Rocket")).toMatchObject({ type: "Spell", signature: true, tag: "Jinx" });
  });
  it("keeps one copy per name, preferring the base print", () => {
    expect(pool.cards.filter((c) => c.name === "Trove Golem")).toHaveLength(1);
    expect(get("Trove Golem")).toMatchObject({ energy: 8, might: 9, power: 2, tag: null, domains: ["Order"] });
  });
  it("leaves tokens, runes, legends and battlefields out of the card pool", () => {
    expect(pool.cards.map((c) => c.name).sort()).toEqual(
      ["Jinx, Rebel", "Long Sword", "Super Mega Death Rocket", "Trove Golem"],
    );
    expect(pool.battlefields).toEqual(["Zaun Warrens"]);
  });
  it("records where the data came from", () => {
    expect(pool.source).toMatchObject({ name: "Riftcodex", placeholder: false, fetchedAt: "2026-10-31T00:00:00Z" });
  });
});
