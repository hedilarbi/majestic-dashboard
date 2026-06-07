import "server-only";

import { getAuthContext } from "./api";

const parseResponseBody = async (response) => {
  const text = await response.text().catch(() => "");

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    if (/^\s*</.test(text)) {
      return {};
    }

    return { message: text };
  }
};

export async function getUsers({
  page = 1,
  limit = 50,
  search = "",
  role = "",
  status = "",
  dateFrom = "",
  dateTo = "",
} = {}) {
  const auth = await getAuthContext();
  if (!auth.ok) {
    return { ok: false, message: auth.message };
  }

  const query = new URLSearchParams();
  if (page) query.append("page", page);
  if (limit) query.append("limit", limit);
  if (search) query.append("search", search);
  if (role) query.append("role", role);
  if (status) query.append("status", status);
  if (dateFrom) query.append("dateFrom", dateFrom);
  if (dateTo) query.append("dateTo", dateTo);

  try {
    const response = await fetch(`${auth.baseUrl}/admin?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await parseResponseBody(response);
    if (!response.ok) {
      return { ok: false, message: data.message || "Erreur lors de la récupération des utilisateurs" };
    }

    return { ok: true, ...data };
  } catch (_error) {
    return { ok: false, message: "Erreur réseau. Vérifiez que l'API serveur est démarrée." };
  }
}

export async function getUserDetails(userId) {
  const auth = await getAuthContext();
  if (!auth.ok) {
    return { ok: false, message: auth.message };
  }

  if (!userId) {
    return { ok: false, message: "Identifiant utilisateur manquant." };
  }

  try {
    const response = await fetch(`${auth.baseUrl}/admin/${userId}`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await parseResponseBody(response);
    if (!response.ok) {
      return { ok: false, message: data.message || "Erreur lors de la récupération des détails de l'utilisateur" };
    }

    return { ok: true, ...data };
  } catch (_error) {
    return { ok: false, message: "Erreur réseau. Vérifiez que l'API serveur est démarrée." };
  }
}

export async function toggleUserStatus(userId) {
  const auth = await getAuthContext();
  if (!auth.ok) {
    return { ok: false, message: auth.message };
  }

  try {
    const response = await fetch(`${auth.baseUrl}/admin/${userId}/toggle-status`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: "application/json",
      },
    });

    const data = await parseResponseBody(response);
    if (!response.ok) {
      return { ok: false, message: data.message || "Erreur lors du changement de statut" };
    }

    return { ok: true, ...data };
  } catch (_error) {
    return { ok: false, message: "Erreur réseau. Vérifiez que l'API serveur est démarrée." };
  }
}
