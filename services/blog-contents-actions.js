"use server";

import { revalidatePath } from "next/cache";

import { BLOGUE_REVALIDATE_PATHS } from "@/lib/blogue/constants";
import { normalizeBlogContent } from "@/lib/blogue/normalize";
import { getAuthContext } from "@/services/api";

const revalidateBlogPaths = () => {
  BLOGUE_REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
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

  const response = await fetch(`${authResult.auth.baseUrl}/blog-contents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authResult.auth.token}`,
    },
    body: formData,
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: data?.message || "Creation impossible.",
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

  const response = await fetch(
    `${authResult.auth.baseUrl}/blog-contents/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${authResult.auth.token}`,
      },
      body: formData,
      cache: "no-store",
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: data?.message || "Modification impossible.",
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

  const response = await fetch(
    `${authResult.auth.baseUrl}/blog-contents/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authResult.auth.token}`,
      },
      cache: "no-store",
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: data?.message || "Suppression impossible.",
    };
  }

  revalidateBlogPaths();

  return {
    ok: true,
    id,
    item: normalizeBlogContent(data?.item),
  };
}
