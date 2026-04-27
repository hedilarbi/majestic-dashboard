import { NextResponse } from "next/server";

import { getAuthContext } from "@/services/api";

const resolveAuthStatus = (message) =>
  message === "Configuration serveur manquante." ? 500 : 401;

export async function GET() {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return NextResponse.json(
      { message: auth.message || "Non authentifié." },
      { status: resolveAuthStatus(auth.message) },
    );
  }

  try {
    const response = await fetch(`${auth.baseUrl}/dashboard-notifications`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Impossible de charger les notifications." },
      { status: 502 },
    );
  }
}

export async function PATCH(request) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return NextResponse.json(
      { message: auth.message || "Non authentifié." },
      { status: resolveAuthStatus(auth.message) },
    );
  }

  const payload = await request.json().catch(() => ({}));

  try {
    const response = await fetch(`${auth.baseUrl}/dashboard-notifications/read`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notificationIds: Array.isArray(payload?.notificationIds)
          ? payload.notificationIds
          : [],
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Impossible de mettre a jour les notifications." },
      { status: 502 },
    );
  }
}
