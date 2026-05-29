import { getAuthContext } from "@/services/api";

const resolveAuthStatus = (message) =>
  message === "Configuration serveur manquante." ? 500 : 401;

export async function GET(_request, { params }) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return new Response(
      JSON.stringify({ message: auth.message || "Non authentifié." }),
      { status: resolveAuthStatus(auth.message), headers: { "Content-Type": "application/json" } },
    );
  }

  const { formId, format } = (await params) || {};

  if (!formId || !format) {
    return new Response(
      JSON.stringify({ message: "Paramètres manquants." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (format !== "excel" && format !== "pdf") {
    return new Response(
      JSON.stringify({ message: "Format invalide. Utilisez 'excel' ou 'pdf'." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const response = await fetch(
      `${auth.baseUrl}/blog-form-submissions/forms/${formId}/submissions/export/${format}`,
      {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          Accept: format === "excel"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/pdf",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ message: data?.message || "Export impossible." }),
        { status: response.status, headers: { "Content-Type": "application/json" } },
      );
    }

    const contentType = response.headers.get("Content-Type") || (
      format === "excel"
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : "application/pdf"
    );
    const contentDisposition = response.headers.get("Content-Disposition") || (
      format === "excel"
        ? `attachment; filename="soumissions-formulaire.xlsx"`
        : `attachment; filename="soumissions-formulaire.pdf"`
    );

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ message: "Erreur serveur lors de l'export." }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}
