import DashboardAccessDenied from "@/components/dashboard/access-denied";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import SallesClient from "./salles-client";
import { getRooms } from "@/services/rooms";
import { getPricing } from "@/services/pricing";

export default async function SallesPage() {
  const canList = await canAccessDashboardPermission("rooms", "list");

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les salles." />
    );
  }

  const [roomsResult, pricingResult] = await Promise.all([
    getRooms(),
    getPricing(),
  ]);

  return (
    <SallesClient
      initialRooms={roomsResult.items}
      initialPricing={pricingResult.items}
      roomsError={roomsResult.error}
      pricingError={pricingResult.error}
    />
  );
}
