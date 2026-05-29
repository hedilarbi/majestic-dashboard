import { NextResponse } from "next/server";

import { getAuthContext } from "@/services/api";

const resolveAuthStatus = (message) =>
  message === "Configuration serveur manquante." ? 500 : 401;

export async function POST(_request, { params }) {
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
    const response = await fetch(`${auth.baseUrl}/audit-logs/bookings/${bookingId}/print-cancelled`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Impossible d'enregistrer l'annulation d'impression." },
      { status: 502 },
    );
  }
}
