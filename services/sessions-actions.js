"use server";

import { revalidatePath } from "next/cache";

import { TIME_PATTERN } from "@/lib/configurations/validators";
import { getAuthContext } from "@/services/api";

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const isValidDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export async function createSessions(payload) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  const {
    eventId,
    date,
    sessionTimes,
    version,
    roomId,
    totalSeats,
    availableSeats,
    overrides,
    pricingOverrides,
    pricingLimits,
  } = payload || {};

  if (!eventId) {
    return { ok: false, message: "Identifiant manquant." };
  }

  if (!date || !isValidDate(date)) {
    return { ok: false, message: "Date invalide." };
  }

  if (!roomId) {
    return { ok: false, message: "Salle manquante." };
  }

  if (!version) {
    return { ok: false, message: "Langue manquante." };
  }

  const times = normalizeArray(sessionTimes).filter((time) =>
    TIME_PATTERN.test(String(time))
  );

  if (!times.length) {
    return { ok: false, message: "Horaire manquant." };
  }

  const total = Number.isFinite(totalSeats) ? totalSeats : 0;
  const available = Number.isFinite(availableSeats) ? availableSeats : total;

  const basePayload = {
    eventId,
    date,
    version,
    roomId,
    totalSeats: total,
    availableSeats: available,
    overrides: normalizeArray(overrides),
    pricingOverrides: normalizeArray(pricingOverrides),
    pricingLimits: normalizeArray(pricingLimits),
  };

  let created = 0;

  for (const time of times) {
    const response = await fetch(`${auth.baseUrl}/sessions/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...basePayload,
        sessionTime: time,
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        message: data?.message || "Création impossible.",
      };
    }

    created += 1;
  }

  revalidatePath(`/evenements/${eventId}`);
  return { ok: true, created };
}

const sanitizePayload = (payload) =>
  Object.fromEntries(
    Object.entries(payload || {}).filter(([, value]) => value !== undefined)
  );

export async function updateSession(id, payload, eventId) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const body = sanitizePayload(payload);

  if (!Object.keys(body).length) {
    return { ok: false, message: "Données manquantes." };
  }

  const response = await fetch(
    `${auth.baseUrl}/sessions/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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

  if (eventId) {
    revalidatePath(`/evenements/${eventId}`);
  } else {
    revalidatePath("/evenements");
  }

  return { ok: true };
}

export async function deleteSession(id, eventId) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const response = await fetch(
    `${auth.baseUrl}/sessions/${encodeURIComponent(id)}`,
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

  if (eventId) {
    revalidatePath(`/evenements/${eventId}`);
  } else {
    revalidatePath("/evenements");
  }

  return { ok: true };
}
