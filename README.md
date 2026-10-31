# Rift Forge

A deck builder for the Riftbound trading card game. Installable web app (PWA) built with Next.js and TypeScript.

## Run it

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # deck rule tests
npm run build
```

## How it's organised

| Path | What it holds |
| --- | --- |
| `src/lib/types.ts` | Card, Legend, Deck types and the six domains |
| `src/lib/rules.ts` | Deck legality checks (`checkDeck`, `isLegalFor`, `RULES`) |
| `src/lib/deckText.ts` | Plain-text deck list export and import |
| `src/data/samplePool.ts` | **Placeholder** card pool used until real card data is loaded |
| `src/components/DeckBuilder.tsx` | The builder UI |
| `src/app/manifest.ts` | PWA manifest so the app can be installed on a phone |

## Deck rules encoded

1 Champion Legend, a Chosen Champion that is a unit of that legend's champion, at least 40 main-deck cards
(Chosen Champion included), at most 3 copies of any card, every card within the legend's two domains,
at most 3 Signature cards, exactly 12 runes in the legend's domains, and 3 different battlefields.
These still need checking against the current official Core Rules.

## Card data

`samplePool.ts` is invented data. Next step is a loader that pulls the real card list (official card gallery
or a community card database) into a versioned JSON file with the same `CardPool` shape.

## Roadmap

1. Real card data and card images
2. Deck stats: energy curve, domain split, card type mix
3. Shareable deck links
4. Accounts and cloud-saved decks
5. Offline support via a service worker
