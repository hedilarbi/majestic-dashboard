import { NextResponse } from "next/server";

import { getAuthContext } from "@/services/api";

const resolveAuthStatus = (message) =>
  message === "Configuration serveur manquante." ? 500 : 401;

export async function GET(request) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return NextResponse.json(
      { message: auth.message || "Non authentifié." },
      { status: resolveAuthStatus(auth.message) },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const query = new URLSearchParams();
  ["dateStart", "dateEnd", "eventId", "sessionTime"].forEach((key) => {
    const value = searchParams.get(key);
    if (value) {
      query.set(key, value);
    }
  });

  const url = `${auth.baseUrl}/statistics/session-sales/pdf${
    query.toString() ? `?${query.toString()}` : ""
  }`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: "application/pdf",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data?.message || "Impossible d'exporter le PDF." },
        { status: response.status },
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "application/pdf";
    const contentDisposition =
      response.headers.get("content-disposition") ||
      'attachment; filename="statistiques-ventes-seances.pdf"';

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Impossible d'exporter le PDF." },
      { status: 502 },
    );
  }
}
