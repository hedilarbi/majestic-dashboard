import "server-only";

import { getAuthContext } from "@/services/api";

export const getGuichetReservationDetails = async (sessionId) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      ok: false,
      status: auth.message === "Configuration serveur manquante." ? 500 : 401,
      data: null,
      message: auth.message || "Non authentifié.",
    };
  }

  if (!sessionId) {
    return {
      ok: false,
      status: 400,
      data: null,
      message: "Session invalide.",
    };
  }

  try {
    const response = await fetch(
      `${auth.baseUrl}/reservations/session/${sessionId}/me`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
        cache: "no-store",
      },
    );

    const data = await response.json().catch(() => ({}));

    return {
      ok: response.ok,
      status: response.status,
      data,
      message: data?.message || "",
    };
  } catch {
    return {
      ok: false,
      status: 502,
      data: null,
      message: "Impossible de charger la réservation.",
    };
  }
};
