import DeckBuilder from "@/components/DeckBuilder";
import { pool } from "@/data/pool";

export default function Home() {
  return <DeckBuilder pool={pool} />;
}
