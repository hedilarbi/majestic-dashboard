import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { hasDashboardPermission } from "@/lib/dashboard-permissions";
import { getAuthContext } from "@/services/api";

const DASHBOARD_ROLES = new Set(["admin", "super_admin"]);

const redirectToConnexion = () => {
  redirect("/api/auth/logout?redirect=/connexion");
};

export const getDashboardUser = cache(async () => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    redirectToConnexion();
  }

  let response;

  try {
    response = await fetch(`${auth.baseUrl}/staff/me`, {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: "no-store",
    });
  } catch {
    redirectToConnexion();
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    redirectToConnexion();
  }

  const role = data?.user?.role;

  if (role === "ticket_office") {
    redirect("/guichet");
  }

  if (role === "cashier") {
    redirect("/caissier");
  }

  if (role === "blog_manager") {
    redirect("/blogue");
  }

  if (!data?.user || !DASHBOARD_ROLES.has(role)) {
    redirectToConnexion();
  }

  return data.user;
});

export const canAccessDashboardPermission = async (moduleKey, action = "list") =>
  hasDashboardPermission(await getDashboardUser(), moduleKey, action);
