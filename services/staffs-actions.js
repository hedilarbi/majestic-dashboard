"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/services/api";

export async function createStaff({
  email,
  firstName,
  lastName,
  phone,
  role,
  password,
  permissions,
}) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!email) {
    return { ok: false, message: "L'email est obligatoire." };
  }

  if (!firstName || !lastName) {
    return { ok: false, message: "Le prénom et le nom sont obligatoires." };
  }

  if (!role) {
    return { ok: false, message: "Le rôle est obligatoire." };
  }

  if (!password) {
    return { ok: false, message: "Le mot de passe est obligatoire." };
  }

  const payload = {
    email,
    firstName,
    lastName,
    phone: phone || undefined,
    role,
    password: password || undefined,
    permissions: Array.isArray(permissions) ? permissions : undefined,
  };

  const response = await fetch(`${auth.baseUrl}/staff/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.log(response);
    return {
      ok: false,
      message: data?.message || "Création impossible.",
    };
  }

  revalidatePath("/staffs");
  return { ok: true };
}

export async function updateStaff({
  id,
  email,
  firstName,
  lastName,
  phone,
  role,
  password,
  permissions,
}) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  if (!email) {
    return { ok: false, message: "L'email est obligatoire." };
  }

  if (!firstName || !lastName) {
    return { ok: false, message: "Le prénom et le nom sont obligatoires." };
  }

  if (!role) {
    return { ok: false, message: "Le rôle est obligatoire." };
  }

  const payload = {
    email,
    firstName,
    lastName,
    phone: phone || undefined,
    role,
    password: password || undefined,
    permissions: Array.isArray(permissions) ? permissions : undefined,
  };

  const response = await fetch(
    `${auth.baseUrl}/staff/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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

  revalidatePath("/staffs");
  return { ok: true };
}

export async function deleteStaff(id) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const response = await fetch(
    `${auth.baseUrl}/staff/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.token}`,
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

  revalidatePath("/staffs");
  return { ok: true };
}

export async function toggleStaffStatus({ id, status }) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const response = await fetch(
    `${auth.baseUrl}/staff/${encodeURIComponent(id)}/toggle-status`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
      cache: "no-store",
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: data?.message || "Mise à jour impossible.",
    };
  }

  revalidatePath("/staffs");
  return { ok: true };
}
