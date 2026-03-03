import "server-only";

import { getAuthContext } from "@/services/api";

const resolveAuthStatus = (message) =>
  message === "Configuration serveur manquante." ? 500 : 401;

export const getGuichetHistory = async ({ page, limit } = {}) => {
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

  try {
    const response = await fetch(
      `${auth.baseUrl}/bookings/me${
        params.toString() ? `?${params.toString()}` : ""
      }`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
        cache: "no-store",
      },
    );

    const data = await response.json().catch(() => ({}));

    return {
      items: Array.isArray(data?.items) ? data.items : [],
      error: response.ok ? "" : data?.message || "Erreur serveur.",
      status: response.status,
    };
  } catch {
    return {
      items: [],
      error: "Impossible de charger l'historique.",
      status: 502,
    };
  }
};
