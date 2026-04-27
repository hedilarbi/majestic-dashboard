import DashboardAccessDenied from "@/components/dashboard/access-denied";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import VersionsClient from "./versions-client";
import { getVersions } from "@/services/versions";

export default async function VersionsPage() {
  const canList = await canAccessDashboardPermission("versions", "list");

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les versions." />
    );
  }

  const { items, error } = await getVersions();

  return <VersionsClient initialVersions={items} initialError={error} />;
}
