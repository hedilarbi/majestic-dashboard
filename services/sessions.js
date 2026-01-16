import "server-only";

import { getAuthContext } from "@/services/api";
import {
  normalizePagination,
  normalizeSessions,
} from "@/lib/evenements/normalize";

const buildSessionsQuery = ({ page, limit, status, from, to }) => {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (status) {
    params.set("status", status);
  }

  if (from) {
    params.set("from", from);
  }

  if (to) {
    params.set("to", to);
  }

  return params.toString();
};

export const getSessions = async ({ page, limit, status, from, to }) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      items: [],
      error: auth.message || "Non authentifié.",
      pagination: {
        page,
        limit,
        total: null,
        totalPages: null,
        hasNext: false,
        hasPrev: page > 1,
      },
    };
  }

  const query = buildSessionsQuery({ page, limit, status, from, to });
  const response = await fetch(`${auth.baseUrl}/sessions/populated?${query}`, {
    headers: { Authorization: `Bearer ${auth.token}` },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      items: [],
      error: data?.message || "Erreur de chargement.",
      pagination: {
        page,
        limit,
        total: null,
        totalPages: null,
        hasNext: false,
        hasPrev: page > 1,
      },
    };
  }

  const items = normalizeSessions(data);

  return {
    items,
    error: "",
    pagination: normalizePagination(data, page, limit, items.length),
  };
};
