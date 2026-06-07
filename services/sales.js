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

const appendOptionalParam = (params, key, value) => {
  if (value !== undefined && value !== null && value !== "") {
    params.set(key, String(value));
  }
};

export const getSalesTransactions = async ({
  page,
  limit,
  dateFrom,
  dateTo,
  paymentMethod,
  paymentStatus,
  bookingSource,
  status,
} = {}) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      items: [],
      error: auth.message || "Non authentifié.",
      status: resolveAuthStatus(auth.message),
    };
  }

  const params = new URLSearchParams();
  appendOptionalParam(params, "page", page);
  appendOptionalParam(params, "limit", limit);
  appendOptionalParam(params, "dateFrom", dateFrom);
  appendOptionalParam(params, "dateTo", dateTo);
  appendOptionalParam(params, "paymentMethod", paymentMethod);
  appendOptionalParam(params, "paymentStatus", paymentStatus);
  appendOptionalParam(params, "bookingSource", bookingSource);
  appendOptionalParam(params, "status", status);

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
      error: auth.message || "Non authentifié.",
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

export const getSalesTickets = async ({
  page,
  limit,
  dateFrom,
  dateTo,
  status,
  pricingName,
} = {}) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      items: [],
      error: auth.message || "Non authentifié.",
      status: resolveAuthStatus(auth.message),
    };
  }

  const params = new URLSearchParams();
  appendOptionalParam(params, "page", page);
  appendOptionalParam(params, "limit", limit);
  appendOptionalParam(params, "dateFrom", dateFrom);
  appendOptionalParam(params, "dateTo", dateTo);
  appendOptionalParam(params, "status", status);
  appendOptionalParam(params, "pricingName", pricingName);

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

export const getSalesSubscriptions = async ({
  page,
  limit,
  dateFrom,
  dateTo,
  paymentMethod,
  paymentStatus,
  status,
  source,
} = {}) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      items: [],
      error: auth.message || "Non authentifié.",
      status: resolveAuthStatus(auth.message),
    };
  }

  const params = new URLSearchParams();
  appendOptionalParam(params, "page", page);
  appendOptionalParam(params, "limit", limit);
  appendOptionalParam(params, "dateFrom", dateFrom);
  appendOptionalParam(params, "dateTo", dateTo);
  appendOptionalParam(params, "paymentMethod", paymentMethod);
  appendOptionalParam(params, "paymentStatus", paymentStatus);
  appendOptionalParam(params, "status", status);
  appendOptionalParam(params, "source", source);

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
