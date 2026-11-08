"use client";

import { useState } from "react";
import { collectionTotals, exportCollection, importCollection, setOwned, type Collection } from "@/lib/collection";
import { DOMAINS, type CardPool, type CardType, type Domain } from "@/lib/types";

type Show = "all" | "owned" | "missing";

export default function CollectionView({
  pool,
  collection,
  onChange,
  notify,
}: {
  pool: CardPool;
  collection: Collection;
  onChange: (c: Collection) => void;
  notify: (msg: string) => void;
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"" | CardType>("");
  const [doms, setDoms] = useState<Domain[]>([]);
  const [show, setShow] = useState<Show>("all");
  const [text, setText] = useState("");
  const [editingText, setEditingText] = useState(false);

  const totals = collectionTotals(collection, pool);
  const shown = pool.cards
    .filter((c) => {
      const have = collection[c.id] ?? 0;
      if (show === "owned" && !have) return false;
      if (show === "missing" && have) return false;
      if (type && c.type !== type) return false;
      if (doms.length && !c.domains.some((d) => doms.includes(d))) return false;
      if (q && !`${c.name} ${c.id}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const set = (id: string, n: number) => onChange(setOwned(collection, id, n));

  const load = (mode: "replace" | "add") => {
    const { collection: parsed, unknown } = importCollection(text, pool);
    const next = mode === "replace" ? {} : { ...collection };
    for (const [id, n] of Object.entries(parsed)) next[id] = (next[id] ?? 0) + n;
    onChange(next);
    setEditingText(false);
    notify(
      unknown.length
        ? `Loaded ${Object.keys(parsed).length} cards. Not found: ${unknown.slice(0, 3).join(", ")}${unknown.length > 3 ? "…" : ""}`
        : `Loaded ${Object.keys(parsed).length} cards`,
    );
  };

  const exported = exportCollection(collection, pool);

  return (
    <div className="grid collection">
      <section className="panel pool">
        <h2>My collection</h2>
        <p className="meta" style={{ marginTop: 0 }}>
          Set how many copies of each card you own. It saves in this browser as you go.
        </p>
        <div className="filters">
          <input id="col-search" type="search" placeholder="Search card name" value={q} onChange={(e) => setQ(e.target.value)} />
          <select aria-label="Card type" value={type} onChange={(e) => setType(e.target.value as CardType | "")}>
            <option value="">All types</option>
            {["Unit", "Spell", "Gear", "Champion"].map((t) => <option key={t}>{t}</option>)}
          </select>
          <select aria-label="Show" value={show} onChange={(e) => setShow(e.target.value as Show)}>
            <option value="all">All cards</option>
            <option value="owned">Cards I own</option>
            <option value="missing">Cards I don&apos;t own</option>
          </select>
        </div>
        <div className="chips">
          {DOMAINS.map((d) => (
            <button
              key={d}
              className="chip"
              aria-pressed={doms.includes(d)}
              onClick={() => setDoms(doms.includes(d) ? doms.filter((x) => x !== d) : [...doms, d])}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="cards">
          {shown.map((c) => {
            const have = collection[c.id] ?? 0;
            return (
              <div key={c.id} className={`card${have ? " owned" : ""}`}>
                {c.image && (
                  // eslint-disable-next-line @next/next/no-img-element -- remote card art
                  <img className="art" src={c.image} alt={c.name} loading="lazy" />
                )}
                <div className="top">
                  <span className="cname">{c.name}</span>
                  <span className="cost" title="Energy cost">{c.energy}</span>
                </div>
                <div className="meta">
                  {c.type}
                  {c.set && ` · ${c.set}`}
                  {c.rarity && ` · ${c.rarity}`} · <span className="mono">{c.id}</span>
                </div>
                <div className="act">
                  <button aria-label={`Remove one owned ${c.name}`} onClick={() => set(c.id, have - 1)} disabled={!have}>−</button>
                  <input
                    className="qty"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    aria-label={`Copies of ${c.name} owned`}
                    value={have}
                    onChange={(e) => set(c.id, Number(e.target.value))}
                  />
                  <button aria-label={`Add one owned ${c.name}`} onClick={() => set(c.id, have + 1)}>+</button>
                </div>
              </div>
            );
          })}
          {!shown.length && <p className="meta">No cards match these filters.</p>}
        </div>
      </section>

      <aside className="panel">
        <h2>Summary</h2>
        <ul className="rules">
          <li><span /><span>Different cards owned</span><span className="mono">{totals.unique}/{totals.poolSize}</span></li>
          <li><span /><span>Total copies</span><span className="mono">{totals.copies}</span></li>
        </ul>
        <div className="section-h"><span>Collection list</span></div>
        <textarea
          id="collection-text"
          aria-label="Collection list text"
          readOnly={!editingText}
          value={editingText ? text : exported}
          placeholder={editingText ? "One card per line, e.g.\n3 Card Name\n1 Another Card" : "Cards you own appear here."}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="wrap">
          {editingText ? (
            <>
              <button className="primary" onClick={() => load("add")}>Add to collection</button>
              <button onClick={() => load("replace")}>Replace collection</button>
              <button onClick={() => setEditingText(false)}>Cancel</button>
            </>
          ) : (
            <>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(exported).then(
                    () => notify("Copied collection list"),
                    () => notify("Copy was blocked. Select the text and copy it yourself."),
                  )
                }
              >
                Copy list
              </button>
              <button onClick={() => { setText(""); setEditingText(true); }}>Paste a list</button>
              <button
                disabled={!totals.copies}
                onClick={() => { if (confirm("Clear your whole collection?")) onChange({}); }}
              >
                Clear
              </button>
            </>
          )}
        </div>
        <p className="meta">Paste lines like <code>3 Card Name</code> or <code>3x Card Name</code>. Card ids work too.</p>
      </aside>
    </div>
  );
}
