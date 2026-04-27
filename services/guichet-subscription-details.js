import "server-only";

import { getAuthContext } from "@/services/api";

const resolveAuthStatus = (message) =>
  message === "Configuration serveur manquante." ? 500 : 401;

export const getGuichetSubscriptionDetails = async (subscriptionId) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      ok: false,
      status: resolveAuthStatus(auth.message),
      subscription: null,
      message: auth.message || "Non authentifié.",
    };
  }

  if (!subscriptionId) {
    return {
      ok: false,
      status: 400,
      subscription: null,
      message: "Abonnement invalide.",
    };
  }

  try {
    const response = await fetch(
      `${auth.baseUrl}/subscriptions/${encodeURIComponent(String(subscriptionId))}`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
        cache: "no-store",
      },
    );

    const data = await response.json().catch(() => ({}));

    return {
      ok: response.ok,
      status: response.status,
      subscription: data?.subscription || null,
      message: data?.message || "",
    };
  } catch {
    return {
      ok: false,
      status: 502,
      subscription: null,
      message: "Impossible de charger l'abonnement.",
    };
  }
};
