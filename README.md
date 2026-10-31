# Rift Forge

A deck builder for the Riftbound trading card game. Installable web app (PWA) built with Next.js and TypeScript.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # deck rule and importer tests
npm run build
npm run import-cards   # download the real card list into src/data/cards.json
```

## How it's organised

| Path | What it holds |
| --- | --- |
| `src/lib/types.ts` | Card, Legend, Deck types and the six domains |
| `src/lib/rules.ts` | Deck legality checks (`checkDeck`, `isLegalFor`, `RULES`) |
| `src/lib/deckText.ts` | Plain-text deck list export and import |
| `src/lib/riftcodex.ts` | Converts Riftcodex API cards into our card format |
| `scripts/import-cards.ts` | Downloads every card and writes `src/data/cards.json` |
| `src/data/pool.ts` | Uses `cards.json` when it has data, otherwise the placeholder pool |
| `src/data/samplePool.ts` | **Placeholder** card pool used until real card data is loaded |
| `src/components/DeckBuilder.tsx` | The builder UI |
| `src/app/manifest.ts` | PWA manifest so the app can be installed on a phone |

## Deck rules encoded

1 Champion Legend, a Chosen Champion that is a unit of that legend's champion, at least 40 main-deck cards
(Chosen Champion included), at most 3 copies of any card, every card within the legend's two domains,
at most 3 Signature cards, exactly 12 runes in the legend's domains, and 3 different battlefields.
Checked against Core Rules section 103. Units of other champions are allowed if they fit your domains; only
Signature cards must match your legend's champion.

## Card data

Cards come from the [Riftcodex](https://riftcodex.com) open API, an unofficial fan project that is not
affiliated with Riot Games. `npm run import-cards` writes `src/data/cards.json`. Until that file has data
(it is `null` in a fresh clone) the app falls back to the invented sample cards.

The **Update card data** GitHub Action runs every Monday, or on demand from the Actions tab. It imports the
cards, runs the tests and build, and commits `cards.json` when the card list changed.

## Roadmap

1. ~~Real card data and card images~~
2. Deck stats: energy curve, domain split, card type mix
3. Shareable deck links
4. Accounts and cloud-saved decks
5. Offline support via a service worker
