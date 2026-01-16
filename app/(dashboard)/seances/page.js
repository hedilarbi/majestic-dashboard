import SeancesClient from "./seances-client";
import { parseSessionsSearchParams } from "@/lib/seances/search-params";
import { getSessions } from "@/services/sessions";
import { getEvents, getSessionFormData } from "@/services/evenements";

export default async function SeancesPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const { page, limit, status, from, to } =
    parseSessionsSearchParams(resolvedParams);

  const [
    { items, error, pagination },
    { items: events, error: eventsError },
    {
      rooms,
      sessionTimes,
      pricing,
      roomsError,
      sessionTimesError,
      pricingError,
    },
  ] = await Promise.all([
    getSessions({ page, limit, status, from, to }),
    getEvents({ page: 1, limit: 200 }),
    getSessionFormData(),
  ]);

  return (
    <SeancesClient
      initialSessions={items}
      initialError={error}
      initialPagination={pagination}
      initialStatusFilter={status || "Tous"}
      initialDateFrom={from}
      initialDateTo={to}
      events={events}
      eventsError={eventsError}
      rooms={rooms}
      sessionTimes={sessionTimes}
      pricing={pricing}
      roomsError={roomsError}
      sessionTimesError={sessionTimesError}
      pricingError={pricingError}
    />
  );
}
