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

export const getReservationRequests = async ({ status } = {}) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      items: [],
      error: auth.message || "Non authentifié.",
      status: resolveAuthStatus(auth.message),
    };
  }

  const params = new URLSearchParams();

  if (status) {
    params.set("status", status);
  }

  const result = await fetchWithAuth({
    path: `/space-reservation-requests${
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

export const getReservationRequestDetails = async (requestId) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      item: null,
      error: auth.message || "Non authentifié.",
      status: resolveAuthStatus(auth.message),
    };
  }

  if (!requestId) {
    return {
      item: null,
      error: "Demande invalide.",
      status: 400,
    };
  }

  const result = await fetchWithAuth({
    path: `/space-reservation-requests/${requestId}`,
    token: auth.token,
    baseUrl: auth.baseUrl,
  });

  return {
    item: result.data?.item || null,
    error: result.ok ? "" : result.message || "Erreur serveur.",
    status: result.status,
  };
};
