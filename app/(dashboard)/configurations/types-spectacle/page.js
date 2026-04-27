import DashboardAccessDenied from "@/components/dashboard/access-denied";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import TypesSpectacleClient from "./types-spectacle-client";
import { getShowTypes } from "@/services/show-types";

export default async function TypesSpectaclePage() {
  const canList = await canAccessDashboardPermission("show_types", "list");

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les types de spectacle." />
    );
  }

  const { items, error } = await getShowTypes();

  return (
    <TypesSpectacleClient initialShowTypes={items} initialError={error} />
  );
}
