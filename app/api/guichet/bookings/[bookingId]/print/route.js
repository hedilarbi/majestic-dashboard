import { NextResponse } from "next/server";

import { getAuthContext } from "@/services/api";

const resolveAuthStatus = (message) =>
  message === "Configuration serveur manquante." ? 500 : 401;

export async function POST(request, { params }) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return NextResponse.json(
      { message: auth.message || "Non authentifié." },
      { status: resolveAuthStatus(auth.message) },
    );
  }

  const { bookingId } = (await params) || {};
  if (!bookingId) {
    return NextResponse.json(
      { message: "Booking invalide." },
      { status: 400 },
    );
  }

  try {
    const payload = await request.json().catch(() => ({}));
    const hasPayload = payload && Object.keys(payload).length > 0;
    const response = await fetch(`${auth.baseUrl}/audit-logs/bookings/${bookingId}/print`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: "application/json",
        ...(hasPayload ? { "Content-Type": "application/json" } : {}),
      },
      ...(hasPayload ? { body: JSON.stringify(payload) } : {}),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Impossible d'enregistrer l'impression." },
      { status: 502 },
    );
  }
}
