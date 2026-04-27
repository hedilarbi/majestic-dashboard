"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/services/api";

const normalizeNumber = (value) => {
  if (value === null) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseFloat(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
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

const normalizeCode = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim().toUpperCase();
};

const PROMO_CODE_PATTERN = /^[A-Z]{3}\d{3}$/;

const isValidReductionType = (value) =>
  value === "amount" || value === "percent";

const isValidAvailability = (value) =>
  value === "public" || value === "private";

const normalizeAvailability = (value) =>
  value === "private" ? "private" : "public";

export async function generatePromoCode() {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return { ok: false, code: "", message: auth.message || "Non authentifié." };
  }

  const response = await fetch(`${auth.baseUrl}/promo-codes/generate`, {
    headers: {
      Authorization: `Bearer ${auth.token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      code: "",
      message: data?.message || "Generation impossible.",
    };
  }

  return {
    ok: true,
    code: typeof data?.code === "string" ? data.code : "",
    message: "",
  };
}

export async function createPromoCode({
  code,
  reductionValue,
  reductionType,
  availability,
  expiresAt,
  totalUsageLimit,
  userUsageLimit,
  isActive = true,
}) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  const normalizedCode = normalizeCode(code);
  const normalizedReductionValue = normalizeNumber(reductionValue);
  const normalizedTotalUsageLimit = normalizeNumber(totalUsageLimit);
  const normalizedUserUsageLimit = normalizeNumber(userUsageLimit);
  const normalizedDate = normalizeDate(expiresAt);

  if (!normalizedCode) {
    return { ok: false, message: "Le code est obligatoire." };
  }

  if (!PROMO_CODE_PATTERN.test(normalizedCode)) {
    return {
      ok: false,
      message: "Le code doit contenir 3 lettres majuscules suivies de 3 chiffres.",
    };
  }

  if (normalizedReductionValue === null) {
    return { ok: false, message: "La valeur de réduction est invalide." };
  }

  if (!isValidReductionType(reductionType)) {
    return { ok: false, message: "Le type de réduction est invalide." };
  }

  if (!isValidAvailability(normalizeAvailability(availability))) {
    return { ok: false, message: "La disponibilité est invalide." };
  }

  if (!normalizedDate) {
    return { ok: false, message: "La date d'expiration est invalide." };
  }

  if (normalizedTotalUsageLimit === undefined) {
    return { ok: false, message: "La limite totale est invalide." };
  }

  if (normalizedUserUsageLimit === undefined) {
    return { ok: false, message: "La limite par utilisateur est invalide." };
  }

  const payload = {
    code: normalizedCode,
    reductionValue: normalizedReductionValue,
    reductionType,
    availability: normalizeAvailability(availability),
    expiresAt: normalizedDate,
    totalUsageLimit: normalizedTotalUsageLimit,
    userUsageLimit: normalizedUserUsageLimit,
    isActive: Boolean(isActive),
  };

  const response = await fetch(`${auth.baseUrl}/promo-codes`, {
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

  revalidatePath("/configurations/codes-promo");
  return { ok: true };
}

export async function updatePromoCode({
  id,
  code,
  reductionValue,
  reductionType,
  availability,
  expiresAt,
  totalUsageLimit,
  userUsageLimit,
  isActive = true,
}) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const normalizedCode = normalizeCode(code);
  const normalizedReductionValue = normalizeNumber(reductionValue);
  const normalizedTotalUsageLimit = normalizeNumber(totalUsageLimit);
  const normalizedUserUsageLimit = normalizeNumber(userUsageLimit);
  const normalizedDate = normalizeDate(expiresAt);

  if (!normalizedCode) {
    return { ok: false, message: "Le code est obligatoire." };
  }

  if (!PROMO_CODE_PATTERN.test(normalizedCode)) {
    return {
      ok: false,
      message: "Le code doit contenir 3 lettres majuscules suivies de 3 chiffres.",
    };
  }

  if (normalizedReductionValue === null) {
    return { ok: false, message: "La valeur de réduction est invalide." };
  }

  if (!isValidReductionType(reductionType)) {
    return { ok: false, message: "Le type de réduction est invalide." };
  }

  if (!isValidAvailability(normalizeAvailability(availability))) {
    return { ok: false, message: "La disponibilité est invalide." };
  }

  if (!normalizedDate) {
    return { ok: false, message: "La date d'expiration est invalide." };
  }

  if (normalizedTotalUsageLimit === undefined) {
    return { ok: false, message: "La limite totale est invalide." };
  }

  if (normalizedUserUsageLimit === undefined) {
    return { ok: false, message: "La limite par utilisateur est invalide." };
  }

  const payload = {
    code: normalizedCode,
    reductionValue: normalizedReductionValue,
    reductionType,
    availability: normalizeAvailability(availability),
    expiresAt: normalizedDate,
    totalUsageLimit: normalizedTotalUsageLimit,
    userUsageLimit: normalizedUserUsageLimit,
    isActive: Boolean(isActive),
  };

  const response = await fetch(
    `${auth.baseUrl}/promo-codes/${encodeURIComponent(id)}`,
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

  revalidatePath("/configurations/codes-promo");
  return { ok: true };
}

export async function updatePromoCodeStatus({ id, isActive }) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const response = await fetch(
    `${auth.baseUrl}/promo-codes/${encodeURIComponent(id)}/active`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isActive: Boolean(isActive) }),
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

  revalidatePath("/configurations/codes-promo");
  return { ok: true };
}

export async function deletePromoCode(id) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const response = await fetch(
    `${auth.baseUrl}/promo-codes/${encodeURIComponent(id)}`,
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

  revalidatePath("/configurations/codes-promo");
  return { ok: true };
}
