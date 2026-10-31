/**
 * PLACEHOLDER card pool. Names, costs, text and legend domain pairs are invented
 * for development. Replace with the real card list (see README "Card data").
 */
import { DOMAINS, type Card, type CardPool, type CardType, type Legend } from "@/lib/types";

const legends: Legend[] = [
  { id: "L-JINX", champ: "Jinx", title: "Loose Cannon", domains: ["Fury", "Chaos"] },
  { id: "L-VIKTOR", champ: "Viktor", title: "Herald of the Arcane", domains: ["Mind", "Order"] },
  { id: "L-LEESIN", champ: "Lee Sin", title: "Blind Monk", domains: ["Calm", "Body"] },
  { id: "L-DARIUS", champ: "Darius", title: "Hand of Noxus", domains: ["Fury", "Order"] },
  { id: "L-AHRI", champ: "Ahri", title: "Nine-Tailed Fox", domains: ["Mind", "Chaos"] },
  { id: "L-VOLI", champ: "Volibear", title: "Relentless Storm", domains: ["Body", "Fury"] },
];

const names: Record<(typeof DOMAINS)[number], string[]> = {
  Fury: ["Zaunite Brawler", "Flame Chompers", "Reckless Charge", "Hextech Rocket", "Rage Strike", "Scrap Gauntlet", "Firebrand Raider", "Overheat"],
  Calm: ["Temple Acolyte", "Still Waters", "Ionian Sentinel", "Spirit Blossom", "Meditate", "Jade Talisman", "Wandering Monk", "Serene Ward"],
  Mind: ["Piltover Scholar", "Arcane Insight", "Hexcore Prototype", "Mind Spike", "Clockwork Aide", "Lens of Truth", "Academy Prodigy", "Recall"],
  Body: ["Freljord Tusker", "Iron Hide", "Mountain Breaker", "Overpower", "Bearhug", "Rune Plate", "Ram Rider", "Stampede"],
  Chaos: ["Chem-Punk", "Smoke Bomb", "Shimmer Dealer", "Wild Gamble", "Trickster Imp", "Cursed Coin", "Rogue Mage", "Pandemonium"],
  Order: ["Demacian Guard", "Shield Wall", "Noxian Captain", "Decree", "Banner Bearer", "Silverwing Crest", "Vanguard Knight", "Rally"],
};
const types: CardType[] = ["Unit", "Spell", "Unit", "Spell", "Unit", "Gear", "Unit", "Spell"];
const text: Record<string, string> = {
  Unit: "When played, deal 1 to an enemy unit here.",
  Spell: "Give a unit +2 Might this turn.",
  Gear: "Equipped unit has +1 Might.",
};

const cards: Card[] = [];
DOMAINS.forEach((d, di) =>
  names[d].forEach((name, i) => {
    const type = types[i];
    const energy = 1 + ((i * 3 + di) % 6);
    cards.push({
      id: `${d.slice(0, 2).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
      name, type, domains: [d], energy, power: energy > 3 ? 1 : 0,
      might: type === "Unit" ? Math.max(1, energy - 1) : null,
      text: text[type], tag: null, signature: false,
    });
  }),
);
legends.forEach((l, i) => {
  cards.push(
    { id: `CHAMP-${i * 2 + 1}`, name: `${l.champ}, Rebel`, type: "Champion", domains: [l.domains[0]], energy: 5, power: 1, might: 5, text: "Accelerate. When this attacks, draw a card.", tag: l.champ, signature: false },
    { id: `CHAMP-${i * 2 + 2}`, name: `${l.champ}, Unbound`, type: "Champion", domains: [l.domains[1]], energy: 6, power: 2, might: 6, text: "Shield. When played, ready your runes.", tag: l.champ, signature: false },
    { id: `SIG-${i + 1}`, name: `${l.champ}'s Signature`, type: "Spell", domains: [l.domains[0]], energy: 3, power: 1, might: null, text: `Signature (${l.champ}). Deal 3 to a unit.`, tag: l.champ, signature: true },
  );
});

export const samplePool: CardPool = {
  legends,
  cards,
  battlefields: ["Sunken Temple", "Zaun Undercity", "Targon Peak", "Bandle Grove", "Shurima Ruins", "Noxian Arena", "Freljord Pass"],
};
