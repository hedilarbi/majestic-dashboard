import DashboardAccessDenied from "@/components/dashboard/access-denied";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import TarifsClient from "./tarifs-client";
import { getPricing } from "@/services/pricing";

export default async function TarifsPage() {
  const canList = await canAccessDashboardPermission("pricing", "list");

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les tarifs." />
    );
  }

  const { items, error } = await getPricing();

  return <TarifsClient initialPricing={items} initialError={error} />;
}
