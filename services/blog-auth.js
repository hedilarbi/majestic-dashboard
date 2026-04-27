import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { hasDashboardPermission } from "@/lib/dashboard-permissions";
import { getAuthContext } from "@/services/api";

const BLOG_MANAGER_ROLES = new Set(["blog_manager", "super_admin"]);

export const canManageBlogContent = (user) =>
  BLOG_MANAGER_ROLES.has(user?.role);

export const canAccessBlogFormSubmissions = (user) =>
  canManageBlogContent(user) ||
  hasDashboardPermission(user, "blog_form_submissions", "list");

const redirectToConnexion = () => {
  redirect("/api/auth/logout?redirect=/connexion");
};

export const getBlogUser = cache(async () => {
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

  if (!data?.user) {
    redirectToConnexion();
  }

  if (role === "admin" && !canAccessBlogFormSubmissions(data.user)) {
    redirect("/");
  }

  if (!canAccessBlogFormSubmissions(data.user)) {
    redirectToConnexion();
  }

  return data.user;
});
