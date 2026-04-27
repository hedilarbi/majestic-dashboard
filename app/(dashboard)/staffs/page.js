import DashboardAccessDenied from "@/components/dashboard/access-denied";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import StaffsClient from "./staffs-client";
import { getStaffs } from "@/services/staffs";

export default async function StaffsPage() {
  const canList = await canAccessDashboardPermission("staffs", "list");

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter le staff." />
    );
  }

  const { items, error } = await getStaffs();

  return <StaffsClient initialStaffs={items} initialError={error} />;
}
