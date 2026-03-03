import { NextResponse } from "next/server";

import { getAuthContext } from "@/services/api";

const resolveAuthStatus = (message) =>
  message === "Configuration serveur manquante." ? 500 : 401;

export async function GET(_request, { params }) {
  const { seanceId } = (await params) || {};
  const auth = await getAuthContext();

  if (!auth.ok) {
    return NextResponse.json(
      { message: auth.message || "Non authentifie." },
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
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Impossible de charger le plan de salle." },
      { status: 502 },
    );
  }
}
