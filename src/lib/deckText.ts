import { DOMAINS, type CardPool, type Deck, type Domain } from "./types";

export function exportDeck(deck: Deck, pool: CardPool): string {
  const byId = new Map(pool.cards.map((c) => [c.id, c]));
  const legend = pool.legends.find((l) => l.id === deck.legendId);
  const champ = deck.championId ? byId.get(deck.championId) : undefined;
  const lines = [
    `# ${deck.name}`,
    `Legend: ${legend ? `${legend.champ}, ${legend.title}` : "-"}`,
    `Champion: ${champ?.name ?? "-"}`,
    "",
    "Main:",
  ];
  for (const [id, q] of Object.entries(deck.main)) {
    const c = byId.get(id);
    if (c && q > 0) lines.push(`${q} ${c.name}`);
  }
  lines.push("", "Runes:");
  for (const d of DOMAINS) if (deck.runes[d]) lines.push(`${deck.runes[d]} ${d} Rune`);
  lines.push("", "Battlefields:");
  for (const b of deck.battlefields) lines.push(`1 ${b}`);
  return lines.join("\n");
}

export function importDeck(text: string, pool: CardPool, fallback: Deck): Deck {
  const byName = new Map(pool.cards.map((c) => [c.name.toLowerCase(), c]));
  const deck: Deck = { ...fallback, main: {}, runes: {}, battlefields: [] };
  let section = "";
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    let m: RegExpMatchArray | null;
    if (line.startsWith("# ")) { deck.name = line.slice(2); continue; }
    if ((m = line.match(/^Legend:\s*(.+?),/))) {
      const l = pool.legends.find((x) => x.champ === m![1]);
      if (l) deck.legendId = l.id;
      continue;
    }
    if ((m = line.match(/^Champion:\s*(.+)$/))) {
      deck.championId = byName.get(m[1].toLowerCase())?.id ?? null;
      continue;
    }
    if (/^(Main|Runes|Battlefields):$/.test(line)) { section = line; continue; }
    if (!(m = line.match(/^(\d+)\s+(.+)$/))) continue;
    const qty = Number(m[1]);
    const name = m[2];
    if (section === "Main:") {
      const c = byName.get(name.toLowerCase());
      if (c) deck.main[c.id] = (deck.main[c.id] ?? 0) + qty;
    } else if (section === "Runes:") {
      const d = name.replace(/ Rune$/, "") as Domain;
      if (DOMAINS.includes(d)) deck.runes[d] = qty;
    } else if (section === "Battlefields:" && pool.battlefields.includes(name)) {
      deck.battlefields.push(name);
    }
  }
  return deck;
}
