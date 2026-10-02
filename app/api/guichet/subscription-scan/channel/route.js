import { NextResponse } from "next/server";

import { getAuthContext } from "@/services/api";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth.ok) {
    return NextResponse.json(
      { message: auth.message || "Non authentifié." },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(
      `${auth.baseUrl}/subscription-sales/scan-channel`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
        cache: "no-store",
      },
    );
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Impossible d'initialiser l'écoute du scanner." },
      { status: 502 },
    );
  }
}
