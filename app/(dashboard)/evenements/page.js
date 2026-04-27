import DashboardAccessDenied from "@/components/dashboard/access-denied";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import EvenementsClient from "./evenements-client";
import { parseEventsSearchParams } from "@/lib/evenements/search-params";
import { getEvents } from "@/services/evenements";
import { getShowTypes } from "@/services/show-types";

export default async function EvenementsPage({ searchParams }) {
  const canList = await canAccessDashboardPermission("events", "list");

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les événements." />
    );
  }

  const resolvedParams = await searchParams;
  const { page, limit, name, type, status } =
    parseEventsSearchParams(resolvedParams);

  const [
    { items, error, pagination },
    { items: showTypes, error: showTypesError },
  ] = await Promise.all([
    getEvents({
      page,
      limit,
      name,
      type,
      status,
    }),
    getShowTypes(),
  ]);

  return (
    <EvenementsClient
      initialEvents={items}
      initialError={error}
      initialPagination={pagination}
      initialQuery={name}
      initialTypeFilter={type || "Tous"}
      initialStatusFilter={status || "Tous"}
      showTypes={showTypes}
      showTypesError={showTypesError}
    />
  );
}
