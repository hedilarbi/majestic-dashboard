"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/services/api";

const normalizeNumber = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

export async function createSubscription({
  name,
  price,
  totalCredits,
  maxSeatsPerSession,
  allowedSeatType,
  expirationDate,
  description,
  validityDays,
  isActive = true,
}) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!name) {
    return { ok: false, message: "Le nom est obligatoire." };
  }

  const normalizedPrice = normalizeNumber(price);
  const normalizedCredits = normalizeNumber(totalCredits);
  const normalizedDate = normalizeDate(expirationDate);
  const normalizedMaxSeats = normalizeNumber(maxSeatsPerSession);
  const normalizedValidityDays = normalizeNumber(validityDays);

  if (normalizedPrice === null) {
    return { ok: false, message: "Le prix est invalide." };
  }

  if (normalizedCredits === null) {
    return { ok: false, message: "Le total de crédits est invalide." };
  }

  if (!normalizedDate) {
    return { ok: false, message: "La date d'expiration est invalide." };
  }

  const payload = {
    name,
    price: normalizedPrice,
    totalCredits: normalizedCredits,
    expirationDate: normalizedDate,
    description: typeof description === "string" ? description.trim() : "",
    isActive: Boolean(isActive),
    ...(normalizedMaxSeats !== null && { maxSeatsPerSession: normalizedMaxSeats }),
    ...(allowedSeatType && { allowedSeatType }),
    ...(normalizedValidityDays !== null && { validityDays: normalizedValidityDays }),
  };

  const response = await fetch(`${auth.baseUrl}/subscriptions`, {
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

  revalidatePath("/configurations/abonnements");
  return { ok: true };
}

export async function updateSubscription({
  id,
  name,
  price,
  totalCredits,
  maxSeatsPerSession,
  allowedSeatType,
  expirationDate,
  description,
  validityDays,
  isActive = true,
}) {
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

  const normalizedPrice = normalizeNumber(price);
  const normalizedCredits = normalizeNumber(totalCredits);
  const normalizedDate = normalizeDate(expirationDate);
  const normalizedMaxSeats = normalizeNumber(maxSeatsPerSession);
  const normalizedValidityDays = normalizeNumber(validityDays);

  if (normalizedPrice === null) {
    return { ok: false, message: "Le prix est invalide." };
  }

  if (normalizedCredits === null) {
    return { ok: false, message: "Le total de crédits est invalide." };
  }

  if (!normalizedDate) {
    return { ok: false, message: "La date d'expiration est invalide." };
  }

  const payload = {
    name,
    price: normalizedPrice,
    totalCredits: normalizedCredits,
    expirationDate: normalizedDate,
    description: typeof description === "string" ? description.trim() : "",
    isActive: Boolean(isActive),
    ...(normalizedMaxSeats !== null && { maxSeatsPerSession: normalizedMaxSeats }),
    ...(allowedSeatType && { allowedSeatType }),
    ...(normalizedValidityDays !== null && { validityDays: normalizedValidityDays }),
  };

  const response = await fetch(
    `${auth.baseUrl}/subscriptions/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
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

  revalidatePath("/configurations/abonnements");
  return { ok: true };
}

export async function deleteSubscription(id) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const response = await fetch(
    `${auth.baseUrl}/subscriptions/${encodeURIComponent(id)}`,
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

  revalidatePath("/configurations/abonnements");
  return { ok: true };
}
