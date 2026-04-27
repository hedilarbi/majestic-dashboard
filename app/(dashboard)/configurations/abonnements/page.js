import DashboardAccessDenied from "@/components/dashboard/access-denied";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import AbonnementsClient from "./abonnements-client";
import { getSubscriptions } from "@/services/subscriptions";

export default async function AbonnementsPage() {
  const canList = await canAccessDashboardPermission("subscriptions", "list");

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les abonnements." />
    );
  }

  const { items, error } = await getSubscriptions();

  return <AbonnementsClient initialSubscriptions={items} initialError={error} />;
}
