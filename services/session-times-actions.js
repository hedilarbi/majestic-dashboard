"use server";

import { revalidatePath } from "next/cache";

import { TIME_PATTERN } from "@/lib/configurations/validators";
import { getAuthContext } from "@/services/api";


export async function createSessionTime({ time }) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!time || !TIME_PATTERN.test(time)) {
    return { ok: false, message: "Horaire invalide." };
  }

  const response = await fetch(`${auth.baseUrl}/session-times`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ time }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: data?.message || "Création impossible.",
    };
  }

  revalidatePath("/configurations/horaires-seances");
  return { ok: true };
}

export async function updateSessionTime({ id, time }) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  if (!time || !TIME_PATTERN.test(time)) {
    return { ok: false, message: "Horaire invalide." };
  }

  const response = await fetch(
    `${auth.baseUrl}/session-times/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ time }),
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: data?.message || "Modification impossible.",
    };
  }

  revalidatePath("/configurations/horaires-seances");
  return { ok: true };
}

export async function deleteSessionTime(id) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const response = await fetch(
    `${auth.baseUrl}/session-times/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: data?.message || "Suppression impossible.",
    };
  }

  revalidatePath("/configurations/horaires-seances");
  return { ok: true };
}
