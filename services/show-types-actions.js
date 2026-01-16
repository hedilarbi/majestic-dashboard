"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/services/api";

export async function createShowType({ name }) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!name) {
    return { ok: false, message: "Le nom est obligatoire." };
  }

  const response = await fetch(`${auth.baseUrl}/show-types`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: data?.message || "Création impossible.",
    };
  }

  revalidatePath("/configurations/types-spectacle");
  return { ok: true };
}

export async function updateShowType({ id, name }) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  if (!name) {
    return { ok: false, message: "Le nom est obligatoire." };
  }

  const response = await fetch(
    `${auth.baseUrl}/show-types/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
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

  revalidatePath("/configurations/types-spectacle");
  return { ok: true };
}

export async function deleteShowType(id) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const response = await fetch(
    `${auth.baseUrl}/show-types/${encodeURIComponent(id)}`,
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

  revalidatePath("/configurations/types-spectacle");
  return { ok: true };
}
