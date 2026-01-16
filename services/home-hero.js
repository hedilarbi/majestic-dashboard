import "server-only";

import { getAuthContext } from "@/services/api";
import { normalizeHomeHero } from "@/lib/configurations/normalize";

export const getHomeHero = async () => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return { items: [], error: auth.message || "Non authentifié." };
  }

  const response = await fetch(`${auth.baseUrl}/home-hero/`, {
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

  return { items: normalizeHomeHero(data, auth.baseUrl), error: "" };
};
