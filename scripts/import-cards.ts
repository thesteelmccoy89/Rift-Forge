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
    const url = `${BASE}/cards?page=${page}&size=${SIZE}`;
    const res = await fetch(url, { headers: { accept: "application/json", "user-agent": "rift-forge-importer" } });
    const raw = await res.text();
    if (!res.ok) throw new Error(`Riftcodex returned ${res.status} for ${url}: ${raw.slice(0, 300)}`);
    let body: { items: RiftcodexCard[]; pages: number; total: number };
    try {
      body = JSON.parse(raw);
    } catch {
      throw new Error(`Riftcodex sent something that isn't JSON for ${url}: ${raw.slice(0, 300)}`);
    }
    if (!Array.isArray(body.items)) {
      throw new Error(`Unexpected response shape for ${url}. Keys: ${Object.keys(body).join(", ")}`);
    }
    all.push(...body.items);
    console.log(`page ${page}/${body.pages}: ${all.length}/${body.total} cards`);
    if (page >= body.pages || body.items.length === 0) return all;
  }
}

async function main() {
  const raw = await fetchAll();
  const pool = mapRiftcodex(raw, new Date().toISOString());
  const kinds = new Map<string, number>();
  for (const c of raw) {
    const k = `${c.classification?.type}/${c.classification?.supertype ?? "-"}`;
    kinds.set(k, (kinds.get(k) ?? 0) + 1);
  }
  notice(
    `Fetched ${raw.length} cards. Type/supertype counts: ${[...kinds].map(([k, n]) => `${k}=${n}`).join(", ")}. ` +
      `Mapped ${pool.cards.length} cards, ${pool.legends.length} legends, ${pool.battlefields.length} battlefields.`,
  );
  if (!pool.legends.length || pool.cards.length < 100) {
    throw new Error(`Import looks wrong: ${pool.legends.length} legends, ${pool.cards.length} cards. Not writing.`);
  }
  await writeFile(path.join(__dirname, "../src/data/cards.json"), JSON.stringify(pool, null, 1) + "\n");
  console.log(`Wrote ${pool.cards.length} cards, ${pool.legends.length} legends, ${pool.battlefields.length} battlefields.`);
}

/** Lines starting with :: become GitHub Actions annotations, readable from the API. */
function notice(msg: string) {
  console.log(process.env.GITHUB_ACTIONS ? `::notice title=Card import::${msg}` : msg);
}

main().catch((err) => {
  console.error(process.env.GITHUB_ACTIONS ? `::error title=Card import failed::${err?.message ?? err}` : err);
  process.exit(1);
});
