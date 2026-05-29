import { NextResponse } from "next/server";
import { getAuthContext } from "@/services/api";

export async function GET(request) {
  const auth = await getAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message || "Non authentifié." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  try {
    const response = await fetch(
      `${auth.baseUrl}/tickets/search?q=${encodeURIComponent(q)}`,
      {
        headers: { Authorization: `Bearer ${auth.token}` },
        cache: "no-store",
      }
    );
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Erreur lors de la recherche." }, { status: 502 });
  }
}
