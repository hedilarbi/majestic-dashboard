"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "@/services/api";

export async function closeTicketOfficeRegister(staffId) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!staffId) {
    return { ok: false, message: "Guichet manquant." };
  }

  const response = await fetch(
    `${auth.baseUrl}/cash-registers/guichets/${encodeURIComponent(staffId)}/close`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
      cache: "no-store",
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: data?.message || "Clôture impossible.",
    };
  }

  revalidatePath("/caissier");
  revalidatePath(`/caissier/guichets/${staffId}`);
  revalidatePath("/caissier/historique");

  return {
    ok: true,
    closureId: data?.closure?.id || "",
  };
}

export async function closeCashierRegister(staffId) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!staffId) {
    return { ok: false, message: "Caissier manquant." };
  }

  const response = await fetch(
    `${auth.baseUrl}/cash-registers/cashiers/${encodeURIComponent(staffId)}/close`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
      cache: "no-store",
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: data?.message || "Clôture impossible.",
    };
  }

  revalidatePath("/caisse");
  revalidatePath(`/caisse/${staffId}`);

  return {
    ok: true,
    closureId: data?.closure?.id || "",
  };
}
