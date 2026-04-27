import "server-only";

import { getAuthContext } from "@/services/api";
import { normalizeBlogContents } from "@/lib/blogue/normalize";

export const getBlogContents = async ({ type } = {}) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return { items: [], error: auth.message || "Non authentifié." };
  }

  const searchParams = new URLSearchParams();

  if (type) {
    searchParams.set("type", type);
  }

  const response = await fetch(
    `${auth.baseUrl}/blog-contents${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`,
    {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: "no-store",
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      items: [],
      error: data?.message || "Erreur de chargement des contenus.",
    };
  }

  return {
    items: normalizeBlogContents(data),
    error: "",
  };
};
