import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadPool, isFresh, MAX_AGE_MS } from "./livePool";
import type { CardPool } from "./types";

const pool = (fetchedAt?: string): CardPool => ({ source: { name: "x", placeholder: false, fetchedAt }, legends: [], cards: [], battlefields: [] });

describe("isFresh", () => {
  const now = Date.parse("2026-10-31T00:00:00Z");
  it("is fresh within a week", () => expect(isFresh(pool("2026-10-30T00:00:00Z"), now)).toBe(true));
  it("is stale after a week", () => expect(isFresh(pool(new Date(now - MAX_AGE_MS - 1).toISOString()), now)).toBe(false));
  it("is stale without a date", () => expect(isFresh(pool(), now)).toBe(false));
});

describe("downloadPool", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("explains a blocked request instead of failing silently", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>Just a moment...</html>", { status: 403 })));
    await expect(downloadPool()).rejects.toThrow(/403.*Just a moment/);
  });
  it("pages through the API and maps the cards", async () => {
    const card = (n: number, type: string) => ({
      id: `${n}`, name: `C${n}`, riftbound_id: `ogn-${n}`, collector_number: n, attributes: { energy: 1 },
      classification: { type, rarity: "Common", domain: ["Fury"] }, text: { plain: "" }, set: { set_id: "OGN", label: "" },
      media: {}, tags: ["Jinx"], metadata: { alternate_art: false, overnumbered: false, signature: false },
    });
    const pages = [[card(1, "Legend"), card(2, "Unit")], [card(3, "Spell")]];
    const fetchMock = vi.fn(async (url: string) => {
      const page = Number(new URL(url).searchParams.get("page"));
      return new Response(JSON.stringify({ items: pages[page - 1], pages: 2, total: 3 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    const p = await downloadPool();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(p.legends).toHaveLength(1);
    expect(p.cards.map((c) => c.name)).toEqual(["C2", "C3"]);
  });
});
