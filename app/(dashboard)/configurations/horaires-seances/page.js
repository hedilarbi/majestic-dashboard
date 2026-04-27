import DashboardAccessDenied from "@/components/dashboard/access-denied";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import HorairesSeancesClient from "./horaires-seances-client";
import { getSessionTimes } from "@/services/session-times";

export default async function HorairesSeancesPage() {
  const canList = await canAccessDashboardPermission("session_times", "list");

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les horaires de séance." />
    );
  }

  const { items, error } = await getSessionTimes();

  return (
    <HorairesSeancesClient initialSessionTimes={items} initialError={error} />
  );
}
