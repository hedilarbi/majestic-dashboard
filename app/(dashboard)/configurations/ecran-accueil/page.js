import EcranAccueilClient from "./ecran-accueil-client";
import { getHomeHero } from "@/services/home-hero";
import { getEvents } from "@/services/evenements";

export default async function EcranAccueilPage() {
  const [{ items, error }, { items: events, error: eventsError }] =
    await Promise.all([getHomeHero(), getEvents({ page: 1, limit: 200 })]);

  return (
    <EcranAccueilClient
      initialHomeHero={items}
      initialError={error}
      events={events}
      eventsError={eventsError}
    />
  );
}
