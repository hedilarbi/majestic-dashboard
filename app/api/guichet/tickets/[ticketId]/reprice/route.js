import { NextResponse } from "next/server";
import { getAuthContext } from "@/services/api";

export async function PATCH(request, { params }) {
  const auth = await getAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message || "Non authentifié." }, { status: 401 });
  }

  const { ticketId } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const response = await fetch(`${auth.baseUrl}/tickets/${encodeURIComponent(ticketId)}/reprice`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        newPricingName: body.newPricingName,
        paymentMethod: body.paymentMethod || "cash",
      }),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Erreur lors de la correction de tarif." }, { status: 502 });
  }
}
