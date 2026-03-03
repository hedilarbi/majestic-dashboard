import { NextResponse } from "next/server";

import { getAuthContext } from "@/services/api";

const resolveAuthStatus = (message) =>
  message === "Configuration serveur manquante." ? 500 : 401;

export async function DELETE(_request, { params }) {
  const { reservationId } = (await params) || {};
  const auth = await getAuthContext();

  if (!auth.ok) {
    return NextResponse.json(
      { message: auth.message || "Non authentifie." },
      { status: resolveAuthStatus(auth.message) },
    );
  }

  if (!reservationId) {
    return NextResponse.json(
      { message: "Reservation invalide." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${auth.baseUrl}/reservations/${reservationId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
        cache: "no-store",
      },
    );

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Impossible d'annuler la reservation." },
      { status: 502 },
    );
  }
}
