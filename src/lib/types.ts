export const DOMAINS = ["Fury", "Calm", "Mind", "Body", "Chaos", "Order"] as const;
export type Domain = (typeof DOMAINS)[number];

export type CardType = "Unit" | "Spell" | "Gear" | "Champion";

export interface Card {
  id: string;
  name: string;
  type: CardType;
  domains: Domain[];
  energy: number;
  power: number;
  might: number | null;
  text: string;
  /** Champion name this card belongs to (champion units and Signature cards). */
  tag: string | null;
  signature: boolean;
}

export interface Legend {
  id: string;
  champ: string;
  title: string;
  domains: [Domain, Domain];
}

export interface CardPool {
  legends: Legend[];
  cards: Card[];
  battlefields: string[];
}

export interface Deck {
  name: string;
  legendId: string;
  championId: string | null;
  /** card id -> copies, not counting the Chosen Champion */
  main: Record<string, number>;
  runes: Partial<Record<Domain, number>>;
  battlefields: string[];
}
