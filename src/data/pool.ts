import type { CardPool } from "@/lib/types";
import imported from "./cards.json";
import { samplePool } from "./samplePool";

/** Real card data once `npm run import-cards` has run, otherwise the placeholder pool. */
export const pool: CardPool = (imported as CardPool | null) ?? samplePool;
