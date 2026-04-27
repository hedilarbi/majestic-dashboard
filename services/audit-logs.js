import "server-only";

import { getAuthContext } from "@/services/api";

export const getAuditLogs = async ({
  page,
  limit,
  type,
  dateFrom,
  dateTo,
} = {}) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      ok: false,
      items: [],
      total: 0,
      page: 1,
      limit: 50,
      message: auth.message || "Non authentifié.",
    };
  }

  const query = new URLSearchParams();
  if (page) {
    query.set("page", String(page));
  }
  if (limit) {
    query.set("limit", String(limit));
  }
  if (type) {
    query.set("type", type);
  }
  if (dateFrom) {
    query.set("dateFrom", dateFrom);
  }
  if (dateTo) {
    query.set("dateTo", dateTo);
  }

  const response = await fetch(
    `${auth.baseUrl}/audit-logs${query.toString() ? `?${query.toString()}` : ""}`,
    {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: "no-store",
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      items: [],
      total: 0,
      page: 1,
      limit: 50,
      message: data?.message || "Impossible de charger l'audit.",
    };
  }

  return {
    ok: true,
    items: Array.isArray(data?.items) ? data.items : [],
    total: Number.isFinite(Number(data?.total)) ? Number(data.total) : 0,
    page: Number.isFinite(Number(data?.page)) ? Number(data.page) : 1,
    limit: Number.isFinite(Number(data?.limit)) ? Number(data.limit) : 50,
    message: "",
  };
};
