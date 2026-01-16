import HorairesSeancesClient from "./horaires-seances-client";
import { getSessionTimes } from "@/services/session-times";

export default async function HorairesSeancesPage() {
  const { items, error } = await getSessionTimes();

  return (
    <HorairesSeancesClient initialSessionTimes={items} initialError={error} />
  );
}
