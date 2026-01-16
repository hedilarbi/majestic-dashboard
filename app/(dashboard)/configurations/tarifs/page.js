import TarifsClient from "./tarifs-client";
import { getPricing } from "@/services/pricing";

export default async function TarifsPage() {
  const { items, error } = await getPricing();

  return <TarifsClient initialPricing={items} initialError={error} />;
}
