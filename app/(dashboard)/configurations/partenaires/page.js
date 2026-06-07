import DashboardAccessDenied from "@/components/dashboard/access-denied";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import PartenairesClient from "./partenaires-client";
import { getAuthContext } from "@/services/api";

const getPartners = async () => {
  const auth = await getAuthContext();
  if (!auth.ok) return { items: [], error: auth.message };
  try {
    const response = await fetch(`${auth.baseUrl}/partners`, {
      headers: { Authorization: `Bearer ${auth.token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { items: [], error: data?.message || "Erreur serveur" };
    return { items: Array.isArray(data?.partners) ? data.partners : [], error: "" };
  } catch {
    return { items: [], error: "Erreur réseau" };
  }
};

export default async function PartenairesPage() {
  const canList = await canAccessDashboardPermission("home_hero", "list");

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les partenaires." />
    );
  }

  const { items, error } = await getPartners();

  return <PartenairesClient initialPartners={items} initialError={error} />;
}
