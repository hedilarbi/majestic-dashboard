"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "@/services/api";

const normalizeList = (value) => (Array.isArray(value) ? value : []);

const computeCapacity = (layout) =>
  normalizeList(layout).reduce((total, cell) => {
    if (cell?.cellType === "chaise") {
      return total + 1;
    }
    return total;
  }, 0);

const buildPayload = ({ name, layout, overrides, pricingOverrides }) => ({
  name,
  capacity: computeCapacity(layout),
  layout: normalizeList(layout),
  overrides: normalizeList(overrides),
  pricingOverrides: normalizeList(pricingOverrides),
});

export async function createRoom({ name, layout, overrides, pricingOverrides }) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!name?.trim()) {
    return { ok: false, message: "Nom requis." };
  }

  if (!Array.isArray(layout) || layout.length === 0) {
    return { ok: false, message: "Plan de salle manquant." };
  }

  const payload = buildPayload({
    name: name.trim(),
    layout,
    overrides,
    pricingOverrides,
  });

  const response = await fetch(`${auth.baseUrl}/rooms`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: data?.message || "Création impossible.",
    };
  }

  revalidatePath("/configurations/salles");
  return { ok: true };
}

export async function updateRoom({
  id,
  name,
  layout,
  overrides,
  pricingOverrides,
}) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  if (!name?.trim()) {
    return { ok: false, message: "Nom requis." };
  }

  if (!Array.isArray(layout) || layout.length === 0) {
    return { ok: false, message: "Plan de salle manquant." };
  }

  const payload = buildPayload({
    name: name.trim(),
    layout,
    overrides,
    pricingOverrides,
  });

  const response = await fetch(
    `${auth.baseUrl}/rooms/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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

  revalidatePath("/configurations/salles");
  return { ok: true };
}

export async function deleteRoom(id) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const response = await fetch(
    `${auth.baseUrl}/rooms/${encodeURIComponent(id)}`,
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

  revalidatePath("/configurations/salles");
  return { ok: true };
}
