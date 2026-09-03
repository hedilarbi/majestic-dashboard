"use server";

import { revalidatePath } from "next/cache";

import { BLOGUE_REVALIDATE_PATHS } from "@/lib/blogue/constants";
import { normalizeBlogContent } from "@/lib/blogue/normalize";
import { getAuthContext } from "@/services/api";

const revalidateBlogPaths = () => {
  BLOGUE_REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
};

const sanitizeTextResponse = (value) =>
  String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 260);

const readApiResponse = async (response) => {
  const rawText = await response.text().catch(() => "");

  if (!rawText) {
    return { data: {}, message: "" };
  }

  try {
    const data = JSON.parse(rawText);
    return {
      data,
      message: typeof data?.message === "string" ? data.message : "",
    };
  } catch (_error) {
    return {
      data: {},
      message: sanitizeTextResponse(rawText),
    };
  }
};

const buildApiErrorMessage = (response, apiMessage, fallback) => {
  const statusLabel = response?.status ? `HTTP ${response.status}` : "";
  const details = [statusLabel, apiMessage].filter(Boolean).join(" - ");

  return details ? `${fallback} (${details})` : fallback;
};

const requestApi = async (url, options) => {
  try {
    return { response: await fetch(url, options), error: "" };
  } catch (_error) {
    return {
      response: null,
      error:
        "API injoignable. Vérifiez BASE_URL et que le serveur backend est démarré.",
    };
  }
};

const handleAuth = async () => {
  const auth = await getAuthContext();
  if (!auth.ok) {
    return { ok: false, message: auth.message || "Non authentifié." };
  }

  return { ok: true, auth };
};

export async function createBlogContent(formData) {
  const authResult = await handleAuth();

  if (!authResult.ok) {
    return authResult;
  }

  const { response, error } = await requestApi(
    `${authResult.auth.baseUrl}/blog-contents`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authResult.auth.token}`,
        Accept: "application/json",
      },
      body: formData,
      cache: "no-store",
    },
  );

  if (error) {
    return { ok: false, message: error };
  }

  const { data, message } = await readApiResponse(response);

  if (!response.ok) {
    return {
      ok: false,
      message: buildApiErrorMessage(
        response,
        message,
        "Création impossible.",
      ),
    };
  }

  if (!data?.item) {
    return {
      ok: false,
      message: buildApiErrorMessage(
        response,
        message || "Réponse API invalide.",
        "Création impossible.",
      ),
    };
  }

  revalidateBlogPaths();

  return {
    ok: true,
    item: normalizeBlogContent(data?.item),
  };
}

export async function updateBlogContent(id, formData) {
  const authResult = await handleAuth();

  if (!authResult.ok) {
    return authResult;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const { response, error } = await requestApi(
    `${authResult.auth.baseUrl}/blog-contents/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${authResult.auth.token}`,
        Accept: "application/json",
      },
      body: formData,
      cache: "no-store",
    },
  );

  if (error) {
    return { ok: false, message: error };
  }

  const { data, message } = await readApiResponse(response);

  if (!response.ok) {
    return {
      ok: false,
      message: buildApiErrorMessage(
        response,
        message,
        "Modification impossible.",
      ),
    };
  }

  if (!data?.item) {
    return {
      ok: false,
      message: buildApiErrorMessage(
        response,
        message || "Réponse API invalide.",
        "Modification impossible.",
      ),
    };
  }

  revalidateBlogPaths();

  return {
    ok: true,
    item: normalizeBlogContent(data?.item),
  };
}

export async function deleteBlogContent(id) {
  const authResult = await handleAuth();

  if (!authResult.ok) {
    return authResult;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const { response, error } = await requestApi(
    `${authResult.auth.baseUrl}/blog-contents/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authResult.auth.token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (error) {
    return { ok: false, message: error };
  }

  const { data, message } = await readApiResponse(response);

  if (!response.ok) {
    return {
      ok: false,
      message: buildApiErrorMessage(
        response,
        message,
        "Suppression impossible.",
      ),
    };
  }

  if (!data?.item) {
    return {
      ok: false,
      message: buildApiErrorMessage(
        response,
        message || "Réponse API invalide.",
        "Suppression impossible.",
      ),
    };
  }

  revalidateBlogPaths();

  return {
    ok: true,
    id,
    item: normalizeBlogContent(data?.item),
  };
}
