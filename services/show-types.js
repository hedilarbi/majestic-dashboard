import "server-only";

import { getAuthContext } from "@/services/api";
import { normalizeShowTypes } from "@/lib/configurations/normalize";

export const getShowTypes = async () => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return { items: [], error: auth.message || "Non authentifié." };
  }

  const response = await fetch(`${auth.baseUrl}/show-types/`, {
    headers: { Authorization: `Bearer ${auth.token}` },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      items: [],
      error: data?.message || "Erreur de chargement.",
    };
  }

  return { items: normalizeShowTypes(data), error: "" };
};
