"use client";

import { useEffect, useMemo, useState } from "react";
import { checkDeck, deckTotals, isLegalFor, RULES } from "@/lib/rules";
import { exportDeck, importDeck } from "@/lib/deckText";
import { deckStats } from "@/lib/stats";
import DeckStats from "./DeckStats";
import { DOMAINS, type Card, type CardPool, type CardType, type Deck, type Domain } from "@/lib/types";

const STORAGE_KEY = "riftforge.decks";

function starterDeck(pool: CardPool, legendId: string): Deck {
  const legend = pool.legends.find((l) => l.id === legendId)!;
  const champ = pool.cards.find((c) => c.type === "Champion" && c.tag === legend.champ);
  return {
    name: `${legend.champ} deck`,
    legendId,
    championId: champ?.id ?? null,
    main: {},
    runes: Object.fromEntries(
      legend.domains.map((d, i) => [d, Math.floor(RULES.runes / legend.domains.length) + (i < RULES.runes % legend.domains.length ? 1 : 0)]),
    ),
    battlefields: [],
  };
}

function loadSaved(): Deck[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

const DomainTag = ({ d }: { d: Domain }) => <span className={`dom d-${d}`}>{d}</span>;

export default function DeckBuilder({ pool }: { pool: CardPool }) {
  const [deck, setDeck] = useState<Deck>(() => starterDeck(pool, pool.legends[0].id));
  const [saved, setSaved] = useState<Deck[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"" | CardType>("");
  const [cost, setCost] = useState("");
  const [doms, setDoms] = useState<Domain[]>([]);
  const [legalOnly, setLegalOnly] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => setSaved(loadSaved()), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const byId = useMemo(() => new Map(pool.cards.map((c) => [c.id, c])), [pool]);
  const legend = pool.legends.find((l) => l.id === deck.legendId)!;
  const checks = checkDeck(deck, pool);
  const totals = deckTotals(deck, byId);
  const champions = pool.cards.filter((c) => c.type === "Champion" && c.tag === legend.champ);

  const shown = pool.cards
    .filter((c) => {
      if (legalOnly && !isLegalFor(c, legend)) return false;
      if (type && c.type !== type) return false;
      if (cost && (cost === "6" ? c.energy < 6 : c.energy !== Number(cost))) return false;
      if (doms.length && !c.domains.some((d) => doms.includes(d))) return false;
      if (q && !`${c.name} ${c.text}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => a.energy - b.energy || a.name.localeCompare(b.name));

  const copies = (c: Card) => (deck.main[c.id] ?? 0) + (c.id === deck.championId ? 1 : 0);
  const change = (id: string, delta: number) =>
    setDeck((d) => {
      const main = { ...d.main, [id]: Math.max(0, (d.main[id] ?? 0) + delta) };
      if (!main[id]) delete main[id];
      return { ...d, main };
    });
  const changeRune = (dom: Domain, delta: number) =>
    setDeck((d) => ({ ...d, runes: { ...d.runes, [dom]: Math.max(0, (d.runes[dom] ?? 0) + delta) } }));
  const toggleBf = (b: string) =>
    setDeck((d) => ({
      ...d,
      battlefields: d.battlefields.includes(b)
        ? d.battlefields.filter((x) => x !== b)
        : d.battlefields.length < RULES.battlefields
          ? [...d.battlefields, b]
          : d.battlefields,
    }));

  const persist = (list: Deck[]) => {
    setSaved(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  };
  const save = () => {
    const list = saved.filter((d) => d.name !== deck.name).concat(deck);
    setToast(persist(list) ? `Saved ${deck.name}` : "This browser blocked saving. Copy the deck list instead.");
  };
  const exported = exportDeck(deck, pool);
  const copy = () =>
    navigator.clipboard.writeText(exported).then(
      () => setToast("Copied deck list"),
      () => setToast("Copy was blocked. Select the text and copy it yourself."),
    );

  const mainEntries = Object.entries(deck.main).sort(
    (a, b) => (byId.get(a[0])?.energy ?? 0) - (byId.get(b[0])?.energy ?? 0),
  );
  const champ = deck.championId ? byId.get(deck.championId) : undefined;

  return (
    <>
      <header>
        <h1>Rift Forge</h1>
        <div className="wrap" style={{ margin: 0 }}>
          <input
            id="deck-name"
            type="text"
            aria-label="Deck name"
            style={{ width: 220 }}
            value={deck.name}
            onChange={(e) => setDeck({ ...deck, name: e.target.value })}
          />
          <button className="primary" onClick={save}>Save deck</button>
          <button onClick={() => setDeck(starterDeck(pool, deck.legendId))}>New deck</button>
        </div>
      </header>
      {pool.source.placeholder ? (
        <div className="note">
          Showing <strong>sample cards</strong> until the real card list loads. Card names, costs and text are
          invented.
        </div>
      ) : (
        <div className="note">
          {pool.cards.length} cards from{" "}
          {pool.source.url ? <a href={pool.source.url}>{pool.source.name}</a> : pool.source.name}
          {pool.source.fetchedAt && `, updated ${pool.source.fetchedAt.slice(0, 10)}`}. Unofficial fan data, not
          affiliated with Riot Games.
        </div>
      )}

      <div className="grid">
        <aside className="panel">
          <h2>Champion Legend</h2>
          <select
            id="legend"
            aria-label="Champion legend"
            value={deck.legendId}
            onChange={(e) => setDeck({ ...starterDeck(pool, e.target.value), name: deck.name })}
          >
            {pool.legends.map((l) => (
              <option key={l.id} value={l.id}>{l.champ}, {l.title}</option>
            ))}
          </select>
          <div className="legend-card">
            {legend.image && (
              // eslint-disable-next-line @next/next/no-img-element -- remote card art
              <img className="art" src={legend.image} alt={legend.title} />
            )}
            <div className="name">{legend.champ}</div>
            <div className="meta" style={{ marginBottom: 6 }}>{legend.title}</div>
            {legend.domains.map((d) => <DomainTag key={d} d={d} />)}
          </div>
          <label className="small" htmlFor="champion">Chosen Champion</label>
          <select
            id="champion"
            value={deck.championId ?? ""}
            onChange={(e) => setDeck({ ...deck, championId: e.target.value || null })}
          >
            {champions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <h2 style={{ marginTop: 16 }}>Deck check</h2>
          <ul className="rules">
            {checks.map((c) => (
              <li key={c.id}>
                <span className={c.ok ? "ok" : "bad"}>{c.ok ? "✓" : "✕"}</span>
                <span>{c.label}</span>
                <span className="mono">{c.detail}</span>
              </li>
            ))}
          </ul>
        </aside>

        <section className="panel pool">
          <h2>Card pool</h2>
          <div className="filters">
            <input id="search" type="search" placeholder="Search name or text" value={q} onChange={(e) => setQ(e.target.value)} />
            <select id="type" aria-label="Card type" value={type} onChange={(e) => setType(e.target.value as CardType | "")}>
              <option value="">All types</option>
              {["Unit", "Spell", "Gear", "Champion"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <select id="cost" aria-label="Energy cost" value={cost} onChange={(e) => setCost(e.target.value)}>
              <option value="">Any cost</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}
              <option value="6">6+</option>
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
          <label className="small">
            <input id="legal-only" type="checkbox" checked={legalOnly} onChange={(e) => setLegalOnly(e.target.checked)} />{" "}
            Only show cards legal for this legend
          </label>
          <div className="cards">
            {shown.map((c) => {
              const legal = isLegalFor(c, legend);
              return (
                <div key={c.id} className={`card${legal ? "" : " off"}`}>
                  {c.image && (
                    // eslint-disable-next-line @next/next/no-img-element -- remote card art, no optimisation needed
                    <img className="art" src={c.image} alt={c.name} loading="lazy" />
                  )}
                  <div className="top">
                    <span className="cname">{c.name}</span>
                    <span className="cost" title="Energy cost">{c.energy}</span>
                  </div>
                  <div>
                    {c.domains.map((d) => <DomainTag key={d} d={d} />)}
                    {c.signature && <span className="badge">Signature</span>}
                  </div>
                  <div className="meta">
                    {c.type}
                    {c.might != null && ` · Might ${c.might}`}
                    {c.power > 0 && ` · Power ${c.power}`} · <span className="mono">{c.id}</span>
                  </div>
                  <div className="txt">{c.text}</div>
                  <div className="act">
                    <button aria-label={`Remove one ${c.name}`} onClick={() => change(c.id, -1)} disabled={!deck.main[c.id]}>−</button>
                    <span className="mono">{copies(c)}</span>
                    <button aria-label={`Add one ${c.name}`} onClick={() => change(c.id, 1)} disabled={!legal}>+</button>
                  </div>
                </div>
              );
            })}
            {!shown.length && <p className="meta">No cards match these filters.</p>}
          </div>
        </section>

        <aside className="panel">
          <h2>Deck</h2>
          <div className="section-h"><span>Main deck</span><span className="mono">{totals.mainQty} cards</span></div>
          <div className="list">
            {champ && (
              <div className="row"><span className="mono">1×</span><span>{champ.name} <span className="badge">Chosen</span></span><span /></div>
            )}
            {mainEntries.map(([id, n]) => (
              <div className="row" key={id}>
                <span className="mono">{n}×</span>
                <span>{byId.get(id)?.name ?? id}</span>
                <button aria-label="Remove one" onClick={() => change(id, -1)}>−</button>
              </div>
            ))}
            {!mainEntries.length && <span className="meta">Add cards from the pool.</span>}
          </div>
          <div className="section-h"><span>Stats</span></div>
          <DeckStats stats={deckStats(deck, byId)} />
          <div className="section-h"><span>Rune deck</span><span className="mono">{totals.runeQty}/{RULES.runes}</span></div>
          {legend.domains.map((d) => (
            <div className="runes" key={d}>
              <DomainTag d={d} />
              <button aria-label={`Fewer ${d} runes`} onClick={() => changeRune(d, -1)}>−</button>
              <span className="mono">{deck.runes[d] ?? 0}</span>
              <button aria-label={`More ${d} runes`} onClick={() => changeRune(d, 1)}>+</button>
            </div>
          ))}
          <div className="section-h"><span>Battlefields</span><span className="mono">{deck.battlefields.length}/{RULES.battlefields}</span></div>
          <div className="wrap">
            {pool.battlefields.map((b) => (
              <button key={b} aria-pressed={deck.battlefields.includes(b)} onClick={() => toggleBf(b)}>{b}</button>
            ))}
          </div>
          <div className="section-h"><span>Export</span></div>
          <textarea
            id="deck-text"
            aria-label="Deck list text"
            readOnly={!importing}
            value={importing ? importText : exported}
            placeholder="Paste a deck list here"
            onChange={(e) => setImportText(e.target.value)}
          />
          <div className="wrap">
            <button onClick={copy}>Copy deck list</button>
            {importing ? (
              <button
                className="primary"
                onClick={() => {
                  setDeck(importDeck(importText, pool, deck));
                  setImporting(false);
                  setToast("Imported deck list");
                }}
              >
                Load pasted list
              </button>
            ) : (
              <button onClick={() => { setImportText(""); setImporting(true); }}>Import from text</button>
            )}
          </div>
          <div className="toast" role="status">{toast}</div>
          <div className="section-h"><span>Saved decks (this browser)</span></div>
          <div className="list">
            {saved.map((d) => (
              <div className="row" key={d.name} style={{ gridTemplateColumns: "1fr auto auto" }}>
                <span>{d.name}</span>
                <button onClick={() => { setDeck(d); setToast(`Opened ${d.name}`); }}>Open</button>
                <button aria-label={`Delete ${d.name}`} onClick={() => persist(saved.filter((x) => x.name !== d.name))}>✕</button>
              </div>
            ))}
            {!saved.length && <span className="meta">Saved decks appear here.</span>}
          </div>
        </aside>
      </div>
    </>
  );
}
