import "server-only";

import { getAuthContext } from "@/services/api";
import {
  buildEventsQuery,
  normalizeEvent,
  normalizeEvents,
  normalizePagination,
  normalizeRooms,
  normalizeSessions,
} from "@/lib/evenements/normalize";
import {
  normalizePricing,
  normalizeSessionTimes,
} from "@/lib/configurations/normalize";

export const getEvents = async ({ page, limit, name, type, status }) => {
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

  const query = buildEventsQuery({ page, limit, name, type, status });
  const response = await fetch(`${auth.baseUrl}/events/?${query}`, {
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

  const items = normalizeEvents(data, auth.baseUrl);

  return {
    items,
    error: "",
    pagination: normalizePagination(data, page, limit, items.length),
  };
};

export const getEventDetails = async (eventId) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return { event: null, error: auth.message || "Non authentifié." };
  }

  const response = await fetch(
    `${auth.baseUrl}/events/${encodeURIComponent(eventId)}`,
    {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      event: null,
      error: data?.message || "Événement introuvable.",
    };
  }

  return { event: normalizeEvent(data, auth.baseUrl), error: "" };
};

export const getEventSessions = async (eventId) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return { sessions: [], error: auth.message || "Non authentifié." };
  }

  const response = await fetch(
    `${auth.baseUrl}/sessions/event/${encodeURIComponent(eventId)}`,
    {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      sessions: [],
      error: data?.message || "Impossible de charger les séances.",
    };
  }

  return { sessions: normalizeSessions(data), error: "" };
};

export const getSessionFormData = async () => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return {
      rooms: [],
      sessionTimes: [],
      pricing: [],
      roomsError: auth.message || "Non authentifié.",
      sessionTimesError: auth.message || "Non authentifié.",
      pricingError: auth.message || "Non authentifié.",
    };
  }

  const [roomsResponse, timesResponse, pricingResponse] = await Promise.all([
    fetch(`${auth.baseUrl}/rooms/`, {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: "no-store",
    }),
    fetch(`${auth.baseUrl}/session-times/`, {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: "no-store",
    }),
    fetch(`${auth.baseUrl}/pricing/`, {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: "no-store",
    }),
  ]);

  const [roomsData, timesData, pricingData] = await Promise.all([
    roomsResponse.json().catch(() => ({})),
    timesResponse.json().catch(() => ({})),
    pricingResponse.json().catch(() => ({})),
  ]);

  return {
    rooms: roomsResponse.ok ? normalizeRooms(roomsData) : [],
    sessionTimes: timesResponse.ok ? normalizeSessionTimes(timesData) : [],
    pricing: pricingResponse.ok ? normalizePricing(pricingData) : [],
    roomsError: roomsResponse.ok
      ? ""
      : roomsData?.message || "Impossible de charger les salles.",
    sessionTimesError: timesResponse.ok
      ? ""
      : timesData?.message || "Impossible de charger les horaires.",
    pricingError: pricingResponse.ok
      ? ""
      : pricingData?.message || "Impossible de charger les tarifs.",
  };
};
