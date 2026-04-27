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

  const body = await request.json().catch(() => ({}));

  try {
    const response = await fetch(`${auth.baseUrl}/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        ticketIds: Array.isArray(body?.ticketIds) ? body.ticketIds : [],
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Impossible d'annuler ce booking." },
      { status: 502 },
    );
  }
}
