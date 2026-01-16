"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/services/api";


const normalizePrice = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

export async function createPricing({ name, price }) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!name) {
    return { ok: false, message: "Le nom est obligatoire." };
  }

  const normalizedPrice = normalizePrice(price);

  if (normalizedPrice === null) {
    return { ok: false, message: "Le tarif est invalide." };
  }

  const response = await fetch(`${auth.baseUrl}/pricing`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, price: normalizedPrice }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: data?.message || "Création impossible.",
    };
  }

  revalidatePath("/configurations/tarifs");
  return { ok: true };
}

export async function updatePricing({ id, name, price }) {
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

  const normalizedPrice = normalizePrice(price);

  if (normalizedPrice === null) {
    return { ok: false, message: "Le tarif est invalide." };
  }

  const response = await fetch(
    `${auth.baseUrl}/pricing/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, price: normalizedPrice }),
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

  revalidatePath("/configurations/tarifs");
  return { ok: true };
}

export async function deletePricing(id) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const response = await fetch(
    `${auth.baseUrl}/pricing/${encodeURIComponent(id)}`,
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

  revalidatePath("/configurations/tarifs");
  return { ok: true };
}
