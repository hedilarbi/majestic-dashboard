import { getAuthContext } from "@/services/api";

const resolveAuthStatus = (message) =>
  message === "Configuration serveur manquante." ? 500 : 401;

export async function proxyPartnersRequest(request, params, method) {
  const auth = await getAuthContext();
  if (!auth.ok) {
    return Response.json(
      { message: auth.message },
      { status: resolveAuthStatus(auth.message) },
    );
  }

  const resolvedParams = params ? await params : {};
  const segments = Array.isArray(resolvedParams?.path)
    ? resolvedParams.path
    : [];
  const path = segments.join("/");
  const url = `${auth.baseUrl}/partners${path ? `/${path}` : ""}`;

  const contentType = request.headers.get("content-type") || "";
  const forwardHeaders = {
    Authorization: `Bearer ${auth.token}`,
    Accept: "application/json",
  };
  let body;

  if (method !== "GET" && method !== "DELETE") {
    if (contentType.includes("multipart/form-data")) {
      body = await request.formData();
    } else {
      body = await request.text();
      forwardHeaders["Content-Type"] = "application/json";
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers: forwardHeaders,
      body,
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));

    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ message: "Erreur serveur." }, { status: 502 });
  }
}
