import { NextResponse } from "next/server";

import { getAuthContext } from "@/services/api";

const resolveAuthStatus = (message) =>
  message === "Configuration serveur manquante." ? 500 : 401;

export async function GET(_request, { params }) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return NextResponse.json(
      { message: auth.message || "Non authentifié." },
      { status: resolveAuthStatus(auth.message) },
    );
  }

  const { formId } = (await params) || {};

  if (!formId) {
    return NextResponse.json({ message: "Formulaire invalide." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${auth.baseUrl}/blog-form-submissions/forms/${formId}/stats`,
      {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Erreur serveur lors du chargement des statistiques." },
      { status: 502 },
    );
  }
}
