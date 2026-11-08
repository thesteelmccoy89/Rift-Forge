/**
 * Downloads the community Riftbound card dataset and writes src/data/cards.json.
 * Run with: npm run import-cards
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { DATASET_JSON, mapCommunityCards, type CommunityCard } from "../src/lib/communityCards";

const SOURCE = process.env.CARDS_URL ?? DATASET_JSON;

/** Lines starting with :: become GitHub Actions annotations, which show on the run summary. */
const notice = (msg: string) => console.log(process.env.GITHUB_ACTIONS ? `::notice title=Card import::${msg}` : msg);

async function main() {
  const res = await fetch(SOURCE, { headers: { accept: "application/json" } });
  const body = await res.text();
  if (!res.ok) throw new Error(`${SOURCE} returned ${res.status}: ${body.slice(0, 300)}`);
  let raw: CommunityCard[];
  try {
    raw = JSON.parse(body);
  } catch {
    throw new Error(`${SOURCE} sent something that isn't JSON: ${body.slice(0, 300)}`);
  }
  if (!Array.isArray(raw)) throw new Error(`Expected a list of cards from ${SOURCE}, got ${typeof raw}`);

  const pool = mapCommunityCards(raw, new Date().toISOString());
  const kinds = new Map<string, number>();
  for (const c of raw) {
    const k = (c.cardTypeLabels ?? [c.cardType]).join("+");
    kinds.set(k, (kinds.get(k) ?? 0) + 1);
  }
  notice(
    `Downloaded ${raw.length} cards. Card kinds: ${[...kinds].map(([k, n]) => `${k}=${n}`).join(", ")}. ` +
      `Kept ${pool.cards.length} cards, ${pool.legends.length} legends, ${pool.battlefields.length} battlefields.`,
  );
  if (!pool.legends.length || pool.cards.length < 100) {
    throw new Error(`Import looks wrong: ${pool.legends.length} legends, ${pool.cards.length} cards. Not writing.`);
  }
  await writeFile(path.join(__dirname, "../src/data/cards.json"), JSON.stringify(pool, null, 1) + "\n");
  console.log(`Wrote ${pool.cards.length} cards, ${pool.legends.length} legends, ${pool.battlefields.length} battlefields.`);
}

main().catch((err) => {
  console.error(process.env.GITHUB_ACTIONS ? `::error title=Card import failed::${err?.message ?? err}` : err);
  process.exit(1);
});
