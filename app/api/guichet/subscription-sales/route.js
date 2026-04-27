import { NextResponse } from "next/server";

import { getAuthContext } from "@/services/api";

const resolveAuthStatus = (message) =>
  message === "Configuration serveur manquante." ? 500 : 401;

export async function POST(request) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return NextResponse.json(
      { message: auth.message || "Non authentifié." },
      { status: resolveAuthStatus(auth.message) },
    );
  }

  const payload = await request.json().catch(() => ({}));
  const body = {
    subscriptionId: payload?.subscriptionId,
    customerContact: payload?.customerContact,
    paymentMethod: payload?.paymentMethod || "cash",
    source: "ticket_office",
  };

  try {
    const response = await fetch(`${auth.baseUrl}/subscription-sales`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Impossible de créer la vente d'abonnement." },
      { status: 502 },
    );
  }
}
