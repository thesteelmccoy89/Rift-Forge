import DeckBuilder from "@/components/DeckBuilder";
import { samplePool } from "@/data/samplePool";

export default function Home() {
  return <DeckBuilder pool={samplePool} />;
}
