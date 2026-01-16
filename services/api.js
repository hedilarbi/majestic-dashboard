import "server-only";

import { cookies } from "next/headers";

export const getBaseUrl = () => process.env.BASE_URL?.replace(/\/$/, "");

export const getAuthContext = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return { ok: false, message: "Non authentifié." };
  }

  const baseUrl = getBaseUrl();

  if (!baseUrl) {
    return { ok: false, message: "Configuration serveur manquante." };
  }

  return { ok: true, token, baseUrl };
};
