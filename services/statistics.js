import "server-only";

import { getAuthContext } from "@/services/api";

export const getStatistics = async ({
  dateStart,
  dateEnd,
  eventId,
  sessionTime,
} = {}) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      ok: false,
      data: null,
      message: auth.message || "Non authentifié.",
    };
  }

  const query = new URLSearchParams();
  if (dateStart) {
    query.set("dateStart", dateStart);
  }
  if (dateEnd) {
    query.set("dateEnd", dateEnd);
  }
  if (eventId) {
    query.set("eventId", eventId);
  }
  if (sessionTime) {
    query.set("sessionTime", sessionTime);
  }

  const url = `${auth.baseUrl}/statistics${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${auth.token}` },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      data: null,
      message: data?.message || "Impossible de charger les statistiques.",
    };
  }

  return {
    ok: true,
    data,
    message: "",
  };
};
