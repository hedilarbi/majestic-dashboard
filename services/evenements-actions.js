"use server";

import { readFile } from "fs/promises";
import path from "path";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/services/api";

const validateEventPayload = (formData) => {
  if (!(formData instanceof FormData)) {
    return { ok: false, message: "Données du formulaire invalides." };
  }

  const name = formData.get("name");
  const type = formData.get("type");

  if (!name || typeof name !== "string" || !name.trim()) {
    return { ok: false, message: "Le nom est obligatoire." };
  }

  if (!type || typeof type !== "string") {
    return { ok: false, message: "Le type est obligatoire." };
  }

  return { ok: true };
};

export async function createEvent(formData) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  const validation = validateEventPayload(formData);

  if (!validation.ok) {
    return validation;
  }

  const response = await fetch(`${auth.baseUrl}/events/`, {
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

  revalidatePath("/evenements");
  return { ok: true };
}

export async function updateEvent(id, formData) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const validation = validateEventPayload(formData);

  if (!validation.ok) {
    return validation;
  }

  const response = await fetch(
    `${auth.baseUrl}/events/${encodeURIComponent(id)}`,
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

  revalidatePath("/evenements");
  return { ok: true };
}

export async function deleteEvent(id) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  const response = await fetch(
    `${auth.baseUrl}/events/${encodeURIComponent(id)}`,
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

  revalidatePath("/evenements");
  return { ok: true };
}

export async function updateEventStatus({ id, status }) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  if (!id) {
    return { ok: false, message: "Identifiant manquant." };
  }

  if (status !== "active" && status !== "inactive") {
    return { ok: false, message: "Statut invalide." };
  }

  const formData = new FormData();
  formData.append("status", status);

  const response = await fetch(
    `${auth.baseUrl}/events/${encodeURIComponent(id)}`,
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
      message: data?.message || "Mise à jour impossible.",
    };
  }

  revalidatePath("/evenements");
  return { ok: true };
}

export async function seedEvents(count = 20) {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return auth;
  }

  const total =
    Number.isFinite(count) && count > 0 ? Math.min(count, 50) : 20;

  const posterPath = path.join(
    process.cwd(),
    "public",
    "images",
    "logo.png"
  );

  let posterBuffer;

  try {
    posterBuffer = await readFile(posterPath);
  } catch {
    return { ok: false, message: "Affiche logo introuvable." };
  }

  const posterBlob = new Blob([posterBuffer], { type: "image/png" });
  let created = 0;
  let failed = 0;

  for (let index = 0; index < total; index += 1) {
    const formData = new FormData();

    formData.append("type", "movie");
    formData.append(
      "name",
      `Film Test ${String(index + 1).padStart(2, "0")}`
    );
    formData.append("status", "active");
    formData.append("genres", "Action");
    formData.append("availableVersions", "VF");
    formData.append(
      "releaseDate",
      new Date(Date.now() + index * 86400000).toISOString()
    );
    formData.append("poster", posterBlob, "logo.png");

    const response = await fetch(`${auth.baseUrl}/events/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
      body: formData,
      cache: "no-store",
    });

    if (response.ok) {
      created += 1;
    } else {
      failed += 1;
    }
  }

  revalidatePath("/evenements");

  if (failed > 0) {
    return {
      ok: false,
      created,
      failed,
      message: `Création partielle: ${created}/${total} films créés.`,
    };
  }

  return { ok: true, created, failed };
}
