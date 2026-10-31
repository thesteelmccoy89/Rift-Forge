import CardPoolLoader from "@/components/CardPoolLoader";
import { pool } from "@/data/pool";

export default function Home() {
  return <CardPoolLoader bundled={pool} />;
}
