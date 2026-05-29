import "server-only";

import { getAuthContext } from "./api";

export async function getUsers({ page = 1, limit = 50, search = "", role = "", status = "" } = {}) {
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

  try {
    const response = await fetch(`${auth.baseUrl}/users?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      return { ok: false, message: data.message || "Erreur lors de la récupération des utilisateurs" };
    }

    return { ok: true, ...data };
  } catch (error) {
    return { ok: false, message: "Erreur réseau" };
  }
}

export async function getUserDetails(userId) {
  const auth = await getAuthContext();
  if (!auth.ok) {
    return { ok: false, message: auth.message };
  }

  try {
    const response = await fetch(`${auth.baseUrl}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      return { ok: false, message: data.message || "Erreur lors de la récupération des détails de l'utilisateur" };
    }

    return { ok: true, ...data };
  } catch (error) {
    return { ok: false, message: "Erreur réseau" };
  }
}

export async function toggleUserStatus(userId) {
  const auth = await getAuthContext();
  if (!auth.ok) {
    return { ok: false, message: auth.message };
  }

  try {
    const response = await fetch(`${auth.baseUrl}/users/${userId}/toggle-status`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return { ok: false, message: data.message || "Erreur lors du changement de statut" };
    }

    return { ok: true, ...data };
  } catch (error) {
    return { ok: false, message: "Erreur réseau" };
  }
}
