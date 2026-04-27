import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { getAuthContext } from "@/services/api";

const redirectToConnexion = () => {
  redirect("/api/auth/logout?redirect=/connexion");
};

export const getCashierUser = cache(async () => {
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

  if (role === "admin" || role === "super_admin") {
    redirect("/");
  }

  if (role === "ticket_office") {
    redirect("/guichet");
  }

  if (role === "blog_manager") {
    redirect("/blogue");
  }

  if (!data?.user || role !== "cashier") {
    redirectToConnexion();
  }

  return data.user;
});
