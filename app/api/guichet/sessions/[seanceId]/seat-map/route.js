import { NextResponse } from "next/server";

import { normalizePosterUrl } from "@/lib/evenements/normalize";
import { getAuthContext } from "@/services/api";

const resolveAuthStatus = (message) =>
  message === "Configuration serveur manquante." ? 500 : 401;

export async function GET(_request, { params }) {
  const { seanceId } = (await params) || {};
  const auth = await getAuthContext();

  if (!auth.ok) {
    return NextResponse.json(
      { message: auth.message || "Non authentifié." },
      { status: resolveAuthStatus(auth.message) },
    );
  }

  if (!seanceId) {
    return NextResponse.json({ message: "Session invalide." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${auth.baseUrl}/map-sessions/${seanceId}/seat-map`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
        cache: "no-store",
      },
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          ...data,
          message:
            data?.message ||
            response.statusText ||
            "Impossible de charger le plan de salle.",
        },
        { status: response.status },
      );
    }

    const normalizedEvent =
      data?.event && typeof data.event === "object"
        ? {
            ...data.event,
            poster: normalizePosterUrl(data.event.poster ?? "", auth.baseUrl),
          }
        : data?.event;

    const normalizedSession =
      data?.session && typeof data.session === "object"
        ? {
            ...data.session,
            poster: normalizePosterUrl(data.session.poster ?? "", auth.baseUrl),
            eventId:
              data.session.eventId && typeof data.session.eventId === "object"
                ? {
                    ...data.session.eventId,
                    poster: normalizePosterUrl(
                      data.session.eventId.poster ?? "",
                      auth.baseUrl,
                    ),
                  }
                : data.session.eventId,
          }
        : data?.session;

    return NextResponse.json(
      {
        ...data,
        event: normalizedEvent,
        session: normalizedSession,
      },
      { status: response.status },
    );
  } catch {
    return NextResponse.json(
      { message: "Impossible de charger le plan de salle." },
      { status: 502 },
    );
  }
}
