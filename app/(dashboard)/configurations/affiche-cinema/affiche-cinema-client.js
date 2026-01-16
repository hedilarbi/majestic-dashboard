"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@/components/ui/icons";
import Modal from "@/components/ui/modal";
import Toast from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import {
  createAfficheCinema,
  updateAfficheCinema,
} from "@/services/affiche-cinema-actions";

const TEXT = {
  title: "Affiche cinéma",
  subtitle: "Gère les événements à l'affiche.",
  listTitle: "Liste des affiches",
  empty: "Aucune affiche pour le moment.",
};

function EventSelect({
  label,
  value,
  options,
  placeholder = "Sélectionner un événement",
  onChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [placement, setPlacement] = useState("down");
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  const filteredOptions = useMemo(() => {
    if (!query.trim()) {
      return options;
    }

    const search = query.trim().toLowerCase();
    return options.filter((option) =>
      option.name.toLowerCase().includes(search)
    );
  }, [options, query]);

  const selectedOption = options.find((option) => option.id === value);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (option) => {
    onChange(option.id);
    setIsOpen(false);
  };

  const isDisabled = options.length === 0;
  const dropdownClasses =
    placement === "up"
      ? "absolute bottom-full mb-2"
      : "absolute top-full mt-2";

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (!isOpen) {
              const rect = buttonRef.current?.getBoundingClientRect();
              if (rect) {
                const dropdownHeight = 280;
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;
                const shouldOpenUp =
                  spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
                setPlacement(shouldOpenUp ? "up" : "down");
              }
            }

            setIsOpen((open) => !open);
          }}
          disabled={isDisabled}
          className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 ${
            isDisabled ? "opacity-60 cursor-not-allowed" : ""
          }`}
          ref={buttonRef}
        >
          <span
            className={
              selectedOption ? "text-slate-900" : "text-slate-400"
            }
          >
            {selectedOption?.name || placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <Icon
              name="chevronDown"
              className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`}
            />
          </span>
        </button>
        {isOpen ? (
          <div
            className={`${dropdownClasses} z-20 w-full rounded-xl border border-slate-200 bg-white shadow-lg`}
          >
            <div className="border-b border-slate-100 p-2">
              <div className="relative">
                <Icon
                  name="search"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher un événement..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>
            <div className="max-h-56 overflow-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500">
                  Aucun résultat.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full px-4 py-2 text-left text-sm transition ${
                      option.id === value
                        ? "bg-primary/10 text-primary"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {option.name}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const buildFormData = ({ formState, posterFile, requirePoster }) => {
  if (!formState.eventId) {
    return { ok: false, message: "Veuillez sélectionner un événement." };
  }

  const formData = new FormData();
  formData.append("eventId", formState.eventId);

  if (posterFile) {
    formData.append("poster", posterFile);
  } else if (requirePoster) {
    return { ok: false, message: "L'affiche est obligatoire." };
  }

  return { ok: true, formData };
};

export default function AfficheCinemaClient({
  initialAffiches = [],
  initialError = "",
  events = [],
  eventsError = "",
}) {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [formState, setFormState] = useState({ eventId: "" });

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
    events.forEach((event) => {
      if (event?.id) {
        lookup[event.id] = event;
      }
    });
    return lookup;
  }, [events]);

  const sortedAffiches = useMemo(() => {
    return [...initialAffiches].sort((a, b) => {
      const nameA = a.eventName || eventLookup[a.eventId]?.name || "";
      const nameB = b.eventName || eventLookup[b.eventId]?.name || "";
      return nameA.localeCompare(nameB);
    });
  }, [eventLookup, initialAffiches]);

  const resetForm = () => {
    setFormState({ eventId: "" });
    setPosterFile(null);
    setPosterPreview("");
    setFormError("");
    setEditingItem(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditModal = (item) => {
    const eventId =
      typeof item.eventId === "string"
        ? item.eventId
        : item.eventId?._id || item.eventId?.id || "";

    setEditingItem(item);
    setFormState({ eventId });
    setPosterFile(null);
    setPosterPreview(item.poster || "");
    setFormError("");
    setIsEditOpen(true);
  };

  const closeFormModals = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    resetForm();
  };

  const handlePosterChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setPosterFile(file);
  };

  const handleEventSelect = (eventId) => {
    setFormState((current) => ({ ...current, eventId }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    const resultPayload = buildFormData({
      formState,
      posterFile,
      requirePoster: true,
    });

    if (!resultPayload.ok) {
      setFormError(resultPayload.message || "Création impossible.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await createAfficheCinema(resultPayload.formData);

      if (!result.ok) {
        const message = result.message || "Création impossible.";
        setFormError(message);
        showToast(message, "error");
        return;
      }

      closeFormModals();
      showToast("Affiche créée avec succès.", "success");
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
    });

    if (!resultPayload.ok) {
      setFormError(resultPayload.message || "Modification impossible.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateAfficheCinema(
        editingItem.id,
        resultPayload.formData
      );

      if (!result.ok) {
        setFormError(result.message || "Modification impossible.");
        return;
      }

      closeFormModals();
      showToast("Affiche modifiée avec succès.", "success");
      router.refresh();
    } catch {
      setFormError("Modification impossible.");
    } finally {
      setIsSaving(false);
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
              Ajouter une affiche
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
                {sortedAffiches.length} affiches disponibles
              </p>
            </div>
          </div>

          {sortedAffiches.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              {TEXT.empty}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Affiche</th>
                    <th className="px-6 py-4">Événement</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  {sortedAffiches.map((item) => {
                    const eventName =
                      item.eventName ||
                      eventLookup[item.eventId]?.name ||
                      (item.eventId
                        ? `#${String(item.eventId).slice(-6).toUpperCase()}`
                        : "-");

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="h-12 w-20 rounded-lg bg-slate-100 overflow-hidden relative">
                            {item.poster ? (
                              <Image
                                src={item.poster}
                                alt={eventName}
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
                          {eventName}
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
            title="Ajouter une affiche"
            description="Sélectionnez un événement et ajoutez son poster."
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

              <EventSelect
                label="Événement"
                value={formState.eventId}
                options={events}
                onChange={handleEventSelect}
              />

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
            title="Modifier l'affiche"
            description="Mettez à jour l'événement ou le poster."
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

              <EventSelect
                label="Événement"
                value={formState.eventId}
                options={events}
                onChange={handleEventSelect}
              />

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
      </div>
      <Toast toast={toast} />
    </>
  );
}
