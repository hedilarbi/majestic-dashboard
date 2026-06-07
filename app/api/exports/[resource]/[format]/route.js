import { getAuthContext } from "@/services/api";

const RESOURCE_PATHS = {
  utilisateurs: "/admin/export",
  transactions: "/bookings/export",
  billets: "/tickets/export",
  abonnements: "/subscription-sales/export",
  caisse: "/cash-registers/cashiers/history/export",
};

const MIME_TYPES = {
  excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
};

const resolveAuthStatus = (message) =>
  message === "Configuration serveur manquante." ? 500 : 401;

export async function GET(request, { params }) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return new Response(
      JSON.stringify({ message: auth.message || "Non authentifié." }),
      { status: resolveAuthStatus(auth.message), headers: { "Content-Type": "application/json" } },
    );
  }

  const { resource, format } = (await params) || {};
  const backendPath = RESOURCE_PATHS[resource];

  if (!backendPath) {
    return new Response(
      JSON.stringify({ message: "Export invalide." }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  if (format !== "excel" && format !== "pdf") {
    return new Response(
      JSON.stringify({ message: "Format invalide. Utilisez 'excel' ou 'pdf'." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const query = request.nextUrl.searchParams.toString();
  const url = `${auth.baseUrl}${backendPath}/${format}${query ? `?${query}` : ""}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: MIME_TYPES[format],
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ message: data?.message || "Export impossible." }),
        { status: response.status, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || MIME_TYPES[format],
        "Content-Disposition":
          response.headers.get("Content-Disposition") ||
          `attachment; filename="${resource}.${format === "excel" ? "xlsx" : "pdf"}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ message: "Erreur serveur lors de l'export." }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}
