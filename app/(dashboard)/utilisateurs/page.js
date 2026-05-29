import DashboardAccessDenied from "@/components/dashboard/access-denied";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import UtilisateursClient from "./utilisateurs-client";
import { getUsers } from "@/services/users";

export default async function UtilisateursPage({ searchParams }) {
  const canList = await canAccessDashboardPermission("users", "list");

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les utilisateurs." />
    );
  }

  const resolvedParams = await searchParams;
  const page = resolvedParams.page || 1;
  const search = resolvedParams.search || "";
  const role = resolvedParams.role || "";
  const status = resolvedParams.status || "";

  const response = await getUsers({ page, search, role, status });

  return (
    <UtilisateursClient 
      initialData={response.ok ? response : { items: [], total: 0, page: 1, limit: 50 }} 
      initialError={response.ok ? "" : response.message}
    />
  );
}
