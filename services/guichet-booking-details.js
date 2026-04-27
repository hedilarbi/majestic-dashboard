import "server-only";

import { getAuthContext } from "@/services/api";

const resolveAuthStatus = (message) =>
  message === "Configuration serveur manquante." ? 500 : 401;

export const getGuichetBookingDetails = async (bookingId) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      ok: false,
      status: resolveAuthStatus(auth.message),
      booking: null,
      message: auth.message || "Non authentifié.",
    };
  }

  if (!bookingId) {
    return {
      ok: false,
      status: 400,
      booking: null,
      message: "Booking invalide.",
    };
  }

  try {
    const response = await fetch(`${auth.baseUrl}/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));

    return {
      ok: response.ok,
      status: response.status,
      booking: data?.booking || null,
      message: data?.message || "",
    };
  } catch {
    return {
      ok: false,
      status: 502,
      booking: null,
      message: "Impossible de charger le booking.",
    };
  }
};
