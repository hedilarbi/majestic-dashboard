import AbonnementsClient from "./abonnements-client";
import { getSubscriptions } from "@/services/subscriptions";

export default async function AbonnementsPage() {
  const { items, error } = await getSubscriptions();

  return <AbonnementsClient initialSubscriptions={items} initialError={error} />;
}
