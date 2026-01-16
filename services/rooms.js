import "server-only";

import { getAuthContext } from "@/services/api";
import { normalizeRooms } from "@/lib/configurations/normalize";

export const getRooms = async () => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return { items: [], error: auth.message || "Non authentifié." };
  }

  const response = await fetch(`${auth.baseUrl}/rooms/`, {
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

  return { items: normalizeRooms(data), error: "" };
};
