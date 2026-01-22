"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/ui/icons";
import Modal from "@/components/ui/modal";
import Toast from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import {
  createHomeHero,
  deleteHomeHero,
  swapHomeHeroOrder,
  updateHomeHero,
  updateHomeHeroEventAffiche,
} from "@/services/home-hero-actions";

const TEXT = {
  title: "Affiches",
  subtitle: "Gère le carrousel hero du site client.",
  listTitle: "Slides du hero",
  empty: "Aucune slide pour le moment.",
};

const buildFormData = ({
  formState,
  posterFile,
  requirePoster,
  requireEvent = false,
  includeOrderActive = true,
}) => {
  const formData = new FormData();

  if (posterFile) {
    formData.append("poster", posterFile);
  } else if (requirePoster) {
    return { ok: false, message: "Veuillez ajouter une affiche." };
  }

  if (formState.title) {
    formData.append("title", formState.title.trim());
  }

  if (formState.subtitle) {
    formData.append("subtitle", formState.subtitle.trim());
  }

  if (formState.eventId) {
    formData.append("eventId", formState.eventId);
  } else if (requireEvent) {
    return { ok: false, message: "Veuillez sélectionner un événement." };
  }

  if (includeOrderActive) {
    if (formState.order) {
      formData.append("order", String(formState.order));
    }

    formData.append("active", formState.active ? "true" : "false");
  }

  return { ok: true, formData };
};

export default function EcranAccueilClient({
  initialHomeHero = [],
  initialError = "",
  events = [],
  eventsError = "",
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [formError, setFormError] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [dragHandleId, setDragHandleId] = useState(null);
  const [activeUpdatingId, setActiveUpdatingId] = useState("");
  const [afficheUpdatingId, setAfficheUpdatingId] = useState("");
  const { toast, showToast } = useToast();

  const [formState, setFormState] = useState({
    title: "",
    subtitle: "",
    order: "",
    active: true,
    eventId: "",
  });

  useEffect(() => {
    setErrorMessage(initialError || "");
  }, [initialError]);

  useEffect(() => {
    if (!posterFile) {
      return undefined;
    }

    const previewUrl = URL.createObjectURL(posterFile);
    setPosterPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [posterFile]);

  const eventLookup = useMemo(() => {
    const lookup = {};
    events.forEach((item) => {
      if (item?.id) {
        lookup[item.id] = item;
      }
    });
    return lookup;
  }, [events]);

  const sortedHero = useMemo(() => {
    return [...initialHomeHero].sort((a, b) => {
      const orderA = Number.isFinite(a.order) ? a.order : 9999;
      const orderB = Number.isFinite(b.order) ? b.order : 9999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return String(a.title || "").localeCompare(String(b.title || ""));
    });
  }, [initialHomeHero]);

  const openCreateModal = () => {
    setFormState({
      title: "",
      subtitle: "",
      order: "",
      active: true,
      eventId: "",
    });
    setPosterFile(null);
    setPosterPreview("");
    setFormError("");
    setEditingItem(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (item) => {
    const eventId =
      typeof item.eventId === "string"
        ? item.eventId
        : item.eventId?._id || item.eventId?.id || "";

    setEditingItem(item);
    setFormState({
      title: item.title || "",
      subtitle: item.subtitle || "",
      order: Number.isFinite(item.order) ? String(item.order) : "",
      active: item.active !== false,
      eventId,
    });
    setPosterFile(null);
    setPosterPreview(item.poster || "");
    setFormError("");
    setIsEditOpen(true);
  };

  const closeFormModals = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setEditingItem(null);
    setFormError("");
  };

  const handlePosterChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setPosterFile(file);
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    const resultPayload = buildFormData({
      formState,
      posterFile,
      requirePoster: true,
      requireEvent: true,
      includeOrderActive: false,
    });

    if (!resultPayload.ok) {
      setFormError(resultPayload.message || "Création impossible.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await createHomeHero(resultPayload.formData);

      if (!result.ok) {
        const message = result.message || "Création impossible.";
        setFormError(message);
        showToast(message, "error");
        return;
      }

      closeFormModals();
      showToast("Slide créée avec succès.", "success");
      router.refresh();
    } catch {
      setFormError("Création impossible.");
      showToast("Création impossible.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingItem) {
      return;
    }

    const resultPayload = buildFormData({
      formState,
      posterFile,
      requirePoster: false,
      includeOrderActive: false,
    });

    if (!resultPayload.ok) {
      setFormError(resultPayload.message || "Modification impossible.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateHomeHero(
        editingItem.id,
        resultPayload.formData,
      );

      if (!result.ok) {
        setFormError(result.message || "Modification impossible.");
        return;
      }

      closeFormModals();
      showToast("Slide modifiée avec succès.", "success");
      router.refresh();
    } catch {
      setFormError("Modification impossible.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteHomeHero(pendingDelete.id);

      if (!result.ok) {
        setErrorMessage(result.message || "Suppression impossible.");
        return;
      }

      setPendingDelete(null);
      router.refresh();
    } catch {
      setErrorMessage("Suppression impossible.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (item) => {
    if (!item?.id) {
      return;
    }

    setActiveUpdatingId(item.id);

    const formData = new FormData();
    formData.append("active", item.active ? "false" : "true");

    try {
      const result = await updateHomeHero(item.id, formData);

      if (!result.ok) {
        showToast(result.message || "Mise à jour impossible.", "error");
        return;
      }

      showToast("Statut mis à jour.", "success");
      router.refresh();
    } catch {
      showToast("Mise à jour impossible.", "error");
    } finally {
      setActiveUpdatingId("");
    }
  };

  const handleToggleEventAffiche = async (item) => {
    if (!item?.id) {
      return;
    }

    setAfficheUpdatingId(item.id);

    try {
      const result = await updateHomeHeroEventAffiche({
        id: item.id,
        eventAffiche: !item.eventAffiche,
      });

      if (!result.ok) {
        showToast(result.message || "Mise à jour impossible.", "error");
        return;
      }

      showToast("Affiche principale mise à jour.", "success");
      router.refresh();
    } catch {
      showToast("Mise à jour impossible.", "error");
    } finally {
      setAfficheUpdatingId("");
    }
  };

  const handleDragHandleDown = (id) => {
    if (isSwapping) {
      return;
    }

    setDragHandleId(id);
  };

  const handleDragHandleUp = () => {
    if (!draggingId) {
      setDragHandleId(null);
    }
  };

  const handleDragStart = (event, id) => {
    if (isSwapping || dragHandleId !== id) {
      event.preventDefault();
      return;
    }

    setDraggingId(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    if (event.currentTarget instanceof HTMLElement) {
      event.dataTransfer.setDragImage(event.currentTarget, 24, 24);
    }
  };

  const handleDragOver = (event, id) => {
    if (!draggingId || draggingId === id) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverId(id);
  };

  const handleDragLeave = (id) => {
    setDragOverId((current) => (current === id ? null : current));
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
    setDragHandleId(null);
  };

  const handleDrop = async (event, targetId) => {
    event.preventDefault();

    const sourceId =
      draggingId || event.dataTransfer.getData("text/plain") || "";

    if (!sourceId || sourceId === targetId) {
      setDragOverId(null);
      return;
    }

    setIsSwapping(true);

    try {
      const result = await swapHomeHeroOrder({
        firstId: sourceId,
        secondId: targetId,
      });

      if (!result.ok) {
        showToast(result.message || "Mise à jour impossible.", "error");
        return;
      }

      showToast("Ordre mis à jour.", "success");
      router.refresh();
    } catch {
      showToast("Mise à jour impossible.", "error");
    } finally {
      setIsSwapping(false);
      setDraggingId(null);
      setDragOverId(null);
      setDragHandleId(null);
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-secondary text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
              {TEXT.title}
            </h1>
            <p className="text-slate-500 mt-1">{TEXT.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary/90"
            >
              <Icon name="plus" className="h-5 w-5" />
              Ajouter une slide
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
        {eventsError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {eventsError}
          </div>
        ) : null}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-secondary text-lg font-semibold text-slate-900">
                {TEXT.listTitle}
              </h2>
              <p className="text-sm text-slate-500">
                {sortedHero.length} slides disponibles
              </p>
            </div>
          </div>

          {sortedHero.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              {TEXT.empty}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-4">Déplacer</th>
                    <th className="px-6 py-4">Affiche</th>
                    <th className="px-6 py-4">Titre</th>

                    <th className="px-6 py-4">Événement</th>
                    <th className="px-6 py-4">Ordre</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4">Affiche principale</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  {sortedHero.map((item) => {
                    const eventName =
                      item.eventName ||
                      eventLookup[item.eventId]?.name ||
                      (item.eventId
                        ? `#${String(item.eventId).slice(-6).toUpperCase()}`
                        : "-");
                    const isDragOver = dragOverId === item.id;
                    const isDragging = draggingId === item.id;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isDragOver ? "bg-primary/5" : "hover:bg-slate-50"
                        } ${isDragging ? "opacity-70" : ""}`}
                        draggable={!isSwapping}
                        onDragStart={(event) => handleDragStart(event, item.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(event) => handleDragOver(event, item.id)}
                        onDragLeave={() => handleDragLeave(item.id)}
                        onDrop={(event) => handleDrop(event, item.id)}
                      >
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition ${
                              isSwapping
                                ? "cursor-not-allowed opacity-50"
                                : "cursor-grab hover:border-primary/40 hover:text-primary"
                            }`}
                            onPointerDown={() => handleDragHandleDown(item.id)}
                            onPointerUp={handleDragHandleUp}
                            onPointerLeave={handleDragHandleUp}
                            aria-label="Déplacer"
                            title="Glisser pour échanger l'ordre"
                          >
                            <Icon name="grip" className="h-4 w-4" />
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-12 w-20 rounded-lg bg-slate-100 overflow-hidden relative">
                            {item.poster ? (
                              <Image
                                src={item.poster}
                                alt={item.title || "Affiche"}
                                fill
                                sizes="80px"
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                                --
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {item.title || "-"}
                        </td>

                        <td className="px-6 py-4 text-slate-500">
                          {eventName}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {Number.isFinite(item.order) ? item.order : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600">
                              {item.active ? "Actif" : "Inactif"}
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={item.active}
                              onClick={() => handleToggleActive(item)}
                              disabled={
                                isSwapping || activeUpdatingId === item.id
                              }
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                                item.active ? "bg-emerald-500" : "bg-slate-300"
                              } ${
                                isSwapping || activeUpdatingId === item.id
                                  ? "cursor-not-allowed opacity-70"
                                  : "hover:opacity-90"
                              }`}
                              aria-label="Basculer l'état"
                            >
                              <span
                                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
                                  item.active
                                    ? "translate-x-5"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40"
                              checked={item.eventAffiche === true}
                              onChange={() => handleToggleEventAffiche(item)}
                              disabled={
                                isSwapping || afficheUpdatingId === item.id
                              }
                            />
                            Affiche principale
                          </label>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary transition hover:bg-primary/10"
                              aria-label="Modifier"
                            >
                              <Icon name="pen" className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(item)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                              aria-label="Supprimer"
                            >
                              <Icon name="trash" className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isCreateOpen ? (
          <Modal
            title="Ajouter une slide"
            description="Renseigne les informations du hero."
            onClose={() => (isSaving ? null : closeFormModals())}
            maxWidth="max-w-xl"
          >
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Affiche
                </label>
                <label
                  htmlFor="create-poster"
                  className="group relative flex h-40 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-primary/50 hover:bg-primary/5"
                >
                  {posterPreview ? (
                    <Image
                      src={posterPreview}
                      alt="Aperçu"
                      fill
                      sizes="(min-width: 768px) 420px, 90vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="text-center text-sm text-slate-500">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                        <Icon name="upload" className="h-5 w-5" />
                      </div>
                      Cliquer pour importer
                    </div>
                  )}
                </label>
                <input
                  id="create-poster"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePosterChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Titre
                </label>
                <input
                  name="title"
                  type="text"
                  value={formState.title}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Sous-titre
                </label>
                <input
                  name="subtitle"
                  type="text"
                  value={formState.subtitle}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Événement lié
                  </label>
                  <div className="relative">
                    <select
                      name="eventId"
                      value={formState.eventId}
                      onChange={handleInputChange}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    >
                      <option value="">Aucun événement</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                      <Icon name="chevronDown" className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              {formError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeFormModals}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  disabled={isSaving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary/90 disabled:opacity-70"
                >
                  {isSaving ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </Modal>
        ) : null}

        {isEditOpen ? (
          <Modal
            title="Modifier la slide"
            description="Mets à jour le contenu du hero."
            onClose={() => (isSaving ? null : closeFormModals())}
            maxWidth="max-w-xl"
          >
            <form className="space-y-4" onSubmit={handleUpdate}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Affiche
                </label>
                <label
                  htmlFor="edit-poster"
                  className="group relative flex h-40 w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-primary/50 hover:bg-primary/5"
                >
                  {posterPreview ? (
                    <Image
                      src={posterPreview}
                      alt="Aperçu"
                      fill
                      sizes="(min-width: 768px) 420px, 90vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="text-center text-sm text-slate-500">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                        <Icon name="upload" className="h-5 w-5" />
                      </div>
                      Cliquer pour importer
                    </div>
                  )}
                </label>
                <input
                  id="edit-poster"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handlePosterChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Titre
                </label>
                <input
                  name="title"
                  type="text"
                  value={formState.title}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Sous-titre
                </label>
                <input
                  name="subtitle"
                  type="text"
                  value={formState.subtitle}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Événement lié
                  </label>
                  <div className="relative">
                    <select
                      name="eventId"
                      value={formState.eventId}
                      onChange={handleInputChange}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    >
                      <option value="">Aucun événement</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                      <Icon name="chevronDown" className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              {formError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeFormModals}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  disabled={isSaving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary/90 disabled:opacity-70"
                >
                  {isSaving ? "Mise à jour..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </Modal>
        ) : null}

        {pendingDelete ? (
          <Modal
            title="Supprimer la slide"
            description={`Confirmer la suppression de "${
              pendingDelete.title || "Sans titre"
            }" ?`}
            onClose={() => (isDeleting ? null : setPendingDelete(null))}
          >
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-red-500/30 transition hover:bg-red-500 disabled:opacity-70"
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </Modal>
        ) : null}
      </div>
      <Toast toast={toast} />
    </>
  );
}
