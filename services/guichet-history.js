import "server-only";

import { getAuthContext } from "@/services/api";

const resolveAuthStatus = (message) =>
  message === "Configuration serveur manquante." ? 500 : 401;

const buildQueryString = ({ page, limit, dateFrom, dateTo } = {}) => {
  const params = new URLSearchParams();

  if (page) {
    params.set("page", String(page));
  }
  if (limit) {
    params.set("limit", String(limit));
  }
  if (dateFrom) {
    params.set("dateFrom", String(dateFrom));
  }
  if (dateTo) {
    params.set("dateTo", String(dateTo));
  }

  return params.toString();
};

const normalizeBookingHistoryItem = (booking) => ({
  id: booking?.id || "",
  type: "ticket",
  reference: booking?.bookingNumber || "",
  title: booking?.session?.event?.name || "Séance",
  subtitle: booking?.session
    ? {
        date: booking.session.date || null,
        sessionTime: booking.session.sessionTime || "",
      }
    : null,
  quantityLabel: `${Number(booking?.seatsCount) || 0} place(s)`,
  totalAmount: Number(booking?.totalAmount) || 0,
  createdAt: booking?.createdAt || null,
  actionHref: booking?.id ? `/guichet/historique/${booking.id}` : "",
});

const normalizeSubscriptionSaleHistoryItem = (sale) => ({
  id: sale?.id || "",
  type: "subscription",
  reference: sale?.subscriptionCode || "",
  title: sale?.subscription?.name || "Abonnement",
  subtitle: null,
  quantityLabel: "1 abonnement",
  totalAmount: Number(sale?.price) || 0,
  createdAt: sale?.createdAt || null,
  actionHref: "",
});

const fetchJson = async (url, token) => {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  return { response, data };
};

export const getGuichetHistory = async ({
  page,
  limit,
  dateFrom,
  dateTo,
  type = "all",
} = {}) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      items: [],
      error: auth.message || "Non authentifié.",
      status: resolveAuthStatus(auth.message),
    };
  }

  const normalizedType =
    type === "ticket" || type === "subscription" ? type : "all";
  const queryString = buildQueryString({ page, limit, dateFrom, dateTo });
  const bookingsUrl = `${auth.baseUrl}/bookings/me${queryString ? `?${queryString}` : ""}`;
  const subscriptionsUrl = `${auth.baseUrl}/subscription-sales/me${
    queryString ? `?${queryString}` : ""
  }`;

  try {
    const shouldFetchBookings = normalizedType === "all" || normalizedType === "ticket";
    const shouldFetchSubscriptions =
      normalizedType === "all" || normalizedType === "subscription";

    const [bookingsResult, subscriptionsResult] = await Promise.all([
      shouldFetchBookings
        ? fetchJson(bookingsUrl, auth.token)
        : Promise.resolve({
            response: { ok: true, status: 200 },
            data: { items: [] },
          }),
      shouldFetchSubscriptions
        ? fetchJson(subscriptionsUrl, auth.token)
        : Promise.resolve({
            response: { ok: true, status: 200 },
            data: { items: [] },
          }),
    ]);

    if (!bookingsResult.response.ok) {
      return {
        items: [],
        error: bookingsResult.data?.message || "Erreur serveur.",
        status: bookingsResult.response.status,
      };
    }

    if (!subscriptionsResult.response.ok) {
      return {
        items: [],
        error: subscriptionsResult.data?.message || "Erreur serveur.",
        status: subscriptionsResult.response.status,
      };
    }

    const bookingItems = Array.isArray(bookingsResult.data?.items)
      ? bookingsResult.data.items.map(normalizeBookingHistoryItem)
      : [];
    const subscriptionItems = Array.isArray(subscriptionsResult.data?.items)
      ? subscriptionsResult.data.items.map(normalizeSubscriptionSaleHistoryItem)
      : [];

    const items = [...bookingItems, ...subscriptionItems].sort(
      (left, right) =>
        new Date(right?.createdAt || 0).getTime() -
        new Date(left?.createdAt || 0).getTime(),
    );

    return {
      items,
      error: "",
      status: 200,
    };
  } catch {
    return {
      items: [],
      error: "Impossible de charger l'historique.",
      status: 502,
    };
  }
};
