import DashboardAccessDenied from "@/components/dashboard/access-denied";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import CodesPromoClient from "./codes-promo-client";
import { getPromoCodes } from "@/services/promo-codes";

export default async function CodesPromoPage() {
  const canList = await canAccessDashboardPermission("promo_codes", "list");

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les codes promo." />
    );
  }

  const { items, error } = await getPromoCodes();

  return <CodesPromoClient initialPromoCodes={items} initialError={error} />;
}
