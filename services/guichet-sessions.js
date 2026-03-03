import "server-only";

import { getAuthContext } from "@/services/api";
import { normalizeSessions } from "@/lib/evenements/normalize";

const buildGuichetSessionsQuery = ({ dateFrom, dateTo, nom }) => {
  const params = new URLSearchParams();

  if (dateFrom) {
    params.set("dateFrom", dateFrom);
  }

  if (dateTo) {
    params.set("dateTo", dateTo);
  }

  if (nom) {
    params.set("nom", nom);
  }

  return params.toString();
};

export const getGuichetSessions = async ({ dateFrom, dateTo, nom } = {}) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      items: [],
      error: auth.message || "Non authentifié.",
    };
  }

  const query = buildGuichetSessionsQuery({ dateFrom, dateTo, nom });
  const response = await fetch(
    `${auth.baseUrl}/sessions/guichet-sessions${query ? `?${query}` : ""}`,
    {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: "no-store",
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      items: [],
      error: data?.message || "Erreur de chargement.",
    };
  }

  return {
    items: normalizeSessions(data, auth.baseUrl),
    error: "",
  };
};
