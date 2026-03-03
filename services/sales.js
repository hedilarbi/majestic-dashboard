import "server-only";

import { getAuthContext } from "@/services/api";

const resolveAuthStatus = (message) =>
  message === "Configuration serveur manquante." ? 500 : 401;

const fetchWithAuth = async ({ path, token, baseUrl }) => {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    data,
    message: data?.message || "",
  };
};

export const getSalesTransactions = async ({ page, limit } = {}) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      items: [],
      error: auth.message || "Non authentifie.",
      status: resolveAuthStatus(auth.message),
    };
  }

  const params = new URLSearchParams();
  if (page) {
    params.set("page", String(page));
  }
  if (limit) {
    params.set("limit", String(limit));
  }

  const result = await fetchWithAuth({
    path: `/bookings${params.toString() ? `?${params.toString()}` : ""}`,
    token: auth.token,
    baseUrl: auth.baseUrl,
  });

  return {
    items: Array.isArray(result.data?.items) ? result.data.items : [],
    error: result.ok ? "" : result.message || "Erreur serveur.",
    status: result.status,
  };
};

export const getSalesBookingDetails = async (bookingId) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      booking: null,
      error: auth.message || "Non authentifie.",
      status: resolveAuthStatus(auth.message),
    };
  }

  if (!bookingId) {
    return {
      booking: null,
      error: "Booking invalide.",
      status: 400,
    };
  }

  const result = await fetchWithAuth({
    path: `/bookings/${bookingId}`,
    token: auth.token,
    baseUrl: auth.baseUrl,
  });

  return {
    booking: result.data?.booking || null,
    error: result.ok ? "" : result.message || "Erreur serveur.",
    status: result.status,
  };
};

export const getSalesTickets = async ({ page, limit } = {}) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      items: [],
      error: auth.message || "Non authentifie.",
      status: resolveAuthStatus(auth.message),
    };
  }

  const params = new URLSearchParams();
  if (page) {
    params.set("page", String(page));
  }
  if (limit) {
    params.set("limit", String(limit));
  }

  const result = await fetchWithAuth({
    path: `/tickets${params.toString() ? `?${params.toString()}` : ""}`,
    token: auth.token,
    baseUrl: auth.baseUrl,
  });

  return {
    items: Array.isArray(result.data?.items) ? result.data.items : [],
    error: result.ok ? "" : result.message || "Erreur serveur.",
    status: result.status,
  };
};

export const getSalesSubscriptions = async ({ page, limit } = {}) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      items: [],
      error: auth.message || "Non authentifie.",
      status: resolveAuthStatus(auth.message),
    };
  }

  const params = new URLSearchParams();
  if (page) {
    params.set("page", String(page));
  }
  if (limit) {
    params.set("limit", String(limit));
  }

  const result = await fetchWithAuth({
    path: `/subscription-sales${
      params.toString() ? `?${params.toString()}` : ""
    }`,
    token: auth.token,
    baseUrl: auth.baseUrl,
  });

  return {
    items: Array.isArray(result.data?.items) ? result.data.items : [],
    error: result.ok ? "" : result.message || "Erreur serveur.",
    status: result.status,
  };
};
