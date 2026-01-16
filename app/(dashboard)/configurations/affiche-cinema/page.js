import AfficheCinemaClient from "./affiche-cinema-client";
import { getAfficheCinema } from "@/services/affiche-cinema";
import { getEvents } from "@/services/evenements";

export default async function AfficheCinemaPage() {
  const [{ items, error }, { items: events, error: eventsError }] =
    await Promise.all([getAfficheCinema(), getEvents({ page: 1, limit: 200 })]);

  return (
    <AfficheCinemaClient
      initialAffiches={items}
      initialError={error}
      events={events}
      eventsError={eventsError}
    />
  );
}
