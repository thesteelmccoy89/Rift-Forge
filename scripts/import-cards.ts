/**
 * Downloads every card from the Riftcodex API and writes src/data/cards.json.
 * Run with: npm run import-cards
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchRiftcodex, mapRiftcodex } from "../src/lib/riftcodex";

const BASE = process.env.RIFTCODEX_URL ?? "https://api.riftcodex.com";
async function main() {
  const raw = await fetchRiftcodex(BASE, {
    headers: { "user-agent": "rift-forge-importer" },
    onPage: (page, pages, got, total) => console.log(`page ${page}/${pages}: ${got}/${total} cards`),
  });
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
