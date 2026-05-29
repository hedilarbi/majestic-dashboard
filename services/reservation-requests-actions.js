"use server";

import { revalidatePath } from "next/cache";

import { getAuthContext } from "@/services/api";

const revalidateReservationRequestPaths = (requestId) => {
  revalidatePath("/demandes-reservation");
  if (requestId) {
    revalidatePath(`/demandes-reservation/${requestId}`);
  }
};

export async function markReservationRequestProcessed(requestId) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return { ok: false, message: auth.message || "Non authentifié." };
  }

  if (!requestId) {
    return { ok: false, message: "Demande invalide." };
  }

  const response = await fetch(
    `${auth.baseUrl}/space-reservation-requests/${encodeURIComponent(
      requestId,
    )}/processed`,
    {
      method: "PATCH",
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
      message: data?.message || "Mise à jour impossible.",
    };
  }

  revalidateReservationRequestPaths(requestId);

  return {
    ok: true,
    item: data?.item || null,
  };
}

export async function sendReservationRequestReply(requestId, { subject, message }) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return { ok: false, message: auth.message || "Non authentifié." };
  }

  if (!requestId) {
    return { ok: false, message: "Demande invalide." };
  }

  if (!subject?.trim() || !message?.trim()) {
    return { ok: false, message: "Le sujet et le message sont requis." };
  }

  const response = await fetch(
    `${auth.baseUrl}/space-reservation-requests/${encodeURIComponent(requestId)}/reply`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      cache: "no-store",
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: data?.message || "Envoi impossible.",
    };
  }

  revalidateReservationRequestPaths(requestId);

  return { ok: true };
}
