"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/services/api";

const validateFormData = (formData) => {
  if (!(formData instanceof FormData)) {
    return { ok: false, message: "Données du formulaire invalides." };
  }

  const poster = formData.get("poster");
  if (!poster) {
    return { ok: false, message: "L'affiche est obligatoire." };
  }

  return { ok: true };
};

export async function createHomeHero(formData) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  const validation = validateFormData(formData);

  if (!validation.ok) {
    return validation;
  }

  const response = await fetch(`${auth.baseUrl}/home-hero/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
    body: formData,
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: data?.message || "Création impossible.",
    };
  }

  revalidatePath("/configurations/affiches");
  return { ok: true };
}

export async function updateHomeHero(id, formData) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  if (!(formData instanceof FormData)) {
    return { ok: false, message: "Données du formulaire invalides." };
  }

  const response = await fetch(
    `${auth.baseUrl}/home-hero/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
      body: formData,
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: data?.message || "Modification impossible.",
    };
  }

  revalidatePath("/configurations/affiches");
  return { ok: true };
}

export async function deleteHomeHero(id) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const response = await fetch(
    `${auth.baseUrl}/home-hero/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: data?.message || "Suppression impossible.",
    };
  }

  revalidatePath("/configurations/affiches");
  return { ok: true };
}

export async function swapHomeHeroOrder({ firstId, secondId }) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!firstId || !secondId) {
    return { ok: false, message: "Identifiants manquants." };
  }

  const response = await fetch(`${auth.baseUrl}/home-hero/swap-order`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ firstId, secondId }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: data?.message || "Mise à jour impossible.",
    };
  }

  revalidatePath("/configurations/affiches");
  return { ok: true };
}

export async function updateHomeHeroEventAffiche({ id, eventAffiche }) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const response = await fetch(
    `${auth.baseUrl}/home-hero/${encodeURIComponent(id)}/event-affiche`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventAffiche: Boolean(eventAffiche) }),
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: data?.message || "Mise à jour impossible.",
    };
  }

  revalidatePath("/configurations/affiches");
  return { ok: true };
}
