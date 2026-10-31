"use client";

import { useEffect, useState } from "react";
import DeckBuilder from "./DeckBuilder";
import { downloadPool, isFresh, readCachedPool } from "@/lib/livePool";
import type { CardPool } from "@/lib/types";

type Status =
  | { kind: "idle" }
  | { kind: "loading"; got: number; total: number }
  | { kind: "error"; message: string };

/**
 * Uses the bundled pool (real cards.json if present, else placeholders) until a fresher
 * card list is available from the browser cache or a live download.
 */
export default function CardPoolLoader({ bundled }: { bundled: CardPool }) {
  const [pool, setPool] = useState(bundled);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const cached = readCachedPool();
    if (cached && (bundled.source.placeholder || cached.source.fetchedAt! > (bundled.source.fetchedAt ?? ""))) {
      setPool(cached);
    }
    const current = cached ?? (bundled.source.placeholder ? null : bundled);
    if (current && isFresh(current) && attempt === 0) return;

    const ctrl = new AbortController();
    setStatus({ kind: "loading", got: 0, total: 0 });
    downloadPool(ctrl.signal, (got, total) => setStatus({ kind: "loading", got, total }))
      .then((p) => {
        // Swap straight in only when replacing sample cards, so a refresh never wipes a deck in progress.
        // A newer list is cached either way and used on the next visit.
        if (!current) setPool(p);
        setStatus({ kind: "idle" });
      })
      .catch((err: Error) => {
        if (ctrl.signal.aborted) return;
        // A failed background refresh doesn't matter while a real card list is showing.
        setStatus(current ? { kind: "idle" } : { kind: "error", message: err.message });
      });
    return () => ctrl.abort();
  }, [bundled, attempt]);

  return (
    <>
      {status.kind === "loading" && (
        <div className="note" role="status">
          Downloading the card list{status.total ? ` (${status.got} of ${status.total})` : ""}…
        </div>
      )}
      {status.kind === "error" && (
        <div className="note" role="alert">
          Couldn&apos;t download the card list, so you&apos;re seeing {pool.source.placeholder ? "sample cards" : "the last saved copy"}.{" "}
          <button onClick={() => setAttempt((a) => a + 1)}>Try again</button>
          <details>
            <summary>Details</summary>
            <code>{status.message}</code>
          </details>
        </div>
      )}
      {/* key resets deck state when the card pool changes underneath it */}
      <DeckBuilder key={`${pool.source.name}-${pool.source.fetchedAt ?? ""}`} pool={pool} />
    </>
  );
}
