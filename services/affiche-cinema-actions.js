"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/services/api";

const validateFormData = (formData, { requirePoster }) => {
  if (!(formData instanceof FormData)) {
    return { ok: false, message: "Données du formulaire invalides." };
  }

  const eventId = formData.get("eventId");
  if (!eventId) {
    return { ok: false, message: "Veuillez sélectionner un événement." };
  }

  if (requirePoster && !formData.get("poster")) {
    return { ok: false, message: "L'affiche est obligatoire." };
  }

  return { ok: true };
};

export async function createAfficheCinema(formData) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  const validation = validateFormData(formData, { requirePoster: true });
  if (!validation.ok) {
    return validation;
  }

  const response = await fetch(`${auth.baseUrl}/a-laffiche/`, {
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

  revalidatePath("/configurations/affiche-cinema");
  return { ok: true };
}

export async function updateAfficheCinema(id, formData) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const validation = validateFormData(formData, { requirePoster: false });
  if (!validation.ok) {
    return validation;
  }

  const response = await fetch(
    `${auth.baseUrl}/a-laffiche/${encodeURIComponent(id)}`,
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

  revalidatePath("/configurations/affiche-cinema");
  return { ok: true };
}
