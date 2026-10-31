import { fetchRiftcodex, mapRiftcodex } from "./riftcodex";
import type { CardPool } from "./types";

const CACHE_KEY = "riftforge.cardpool.v1";
export const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function readCachedPool(): CardPool | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CardPool) : null;
  } catch {
    return null;
  }
}

export function isFresh(pool: CardPool, now = Date.now()): boolean {
  const at = pool.source.fetchedAt ? Date.parse(pool.source.fetchedAt) : NaN;
  return Number.isFinite(at) && now - at < MAX_AGE_MS;
}

/** Downloads the card list from the viewer's browser and caches it for offline use. */
export async function downloadPool(signal?: AbortSignal, onProgress?: (got: number, total: number) => void): Promise<CardPool> {
  const raw = await fetchRiftcodex(undefined, { signal, onPage: (_p, _ps, got, total) => onProgress?.(got, total) });
  const pool = mapRiftcodex(raw, new Date().toISOString());
  if (!pool.legends.length || !pool.cards.length) {
    throw new Error(`The card list looked wrong (${pool.legends.length} legends, ${pool.cards.length} cards).`);
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(pool));
  } catch {
    // Storage full or blocked: still use the cards for this visit.
  }
  return pool;
}
