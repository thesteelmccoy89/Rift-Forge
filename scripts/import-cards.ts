/**
 * Downloads every card from the Riftcodex API and writes src/data/cards.json.
 * Run with: npm run import-cards
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { mapRiftcodex, type RiftcodexCard } from "../src/lib/riftcodex";

const BASE = process.env.RIFTCODEX_URL ?? "https://api.riftcodex.com";
const SIZE = 100; // API maximum

async function fetchAll(): Promise<RiftcodexCard[]> {
  const all: RiftcodexCard[] = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${BASE}/cards?page=${page}&size=${SIZE}`);
    if (!res.ok) throw new Error(`Riftcodex returned ${res.status} for page ${page}`);
    const body = (await res.json()) as { items: RiftcodexCard[]; pages: number; total: number };
    all.push(...body.items);
    console.log(`page ${page}/${body.pages}: ${all.length}/${body.total} cards`);
    if (page >= body.pages || body.items.length === 0) return all;
  }
}

async function main() {
  const raw = await fetchAll();
  const pool = mapRiftcodex(raw, new Date().toISOString());
  if (!pool.legends.length || pool.cards.length < 100) {
    throw new Error(`Import looks wrong: ${pool.legends.length} legends, ${pool.cards.length} cards. Not writing.`);
  }
  await writeFile(path.join(__dirname, "../src/data/cards.json"), JSON.stringify(pool, null, 1) + "\n");
  console.log(`Wrote ${pool.cards.length} cards, ${pool.legends.length} legends, ${pool.battlefields.length} battlefields.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
