"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Icon } from "@/components/ui/icons";
import { createEvent, deleteEvent, seedEvents, updateEvent } from "@/services/evenements-actions";
import ConfirmModal from "@/components/ui/confirm-modal";
import EventFilters from "@/components/evenements/event-filters";
import EventFormModal from "@/components/evenements/event-form-modal";
import EventPagination from "@/components/evenements/event-pagination";
import EventTable from "@/components/evenements/event-table";
import {
  GENRE_OPTIONS,
  INITIAL_FORM,
  buildEventFormData,
  toDateInputValue,
} from "@/lib/evenements/helpers";

export default function EvenementsClient({
  initialEvents = [],
  initialError = "",
  initialPagination = null,
  initialQuery = "",
  initialTypeFilter = "Tous",
  initialStatusFilter = "Tous",
  showTypes = [],
  showTypesError = "",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [noticeMessage, setNoticeMessage] = useState("");
  const [query, setQuery] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState(initialTypeFilter);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [formState, setFormState] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const pagination = initialPagination || {
    page: 1,
    limit: 10,
    total: null,
    totalPages: null,
    hasNext: false,
    hasPrev: false,
  };

  useEffect(() => {
    setErrorMessage(initialError || "");
  }, [initialError]);

  useEffect(() => {
    if (!posterFile) {
      return;
    }

    const previewUrl = URL.createObjectURL(posterFile);
    setPosterPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [posterFile]);

  const events = initialEvents;
  const showTypeNames = useMemo(
    () => showTypes.map((item) => item?.name).filter(Boolean),
    [showTypes]
  );
  const movieGenreValues = useMemo(
    () => GENRE_OPTIONS.map((option) => option.value),
    []
  );

  useEffect(() => {
    setFormState((current) => {
      if (current.type === "show" && showTypeNames.length === 0) {
        return current;
      }

      const allowed =
        current.type === "show" ? showTypeNames : movieGenreValues;
      const filtered = current.genres.filter((genre) =>
        allowed.includes(genre)
      );

      if (filtered.length === current.genres.length) {
        return current;
      }

      return { ...current, genres: filtered };
    });
  }, [formState.type, movieGenreValues, showTypeNames]);

  useEffect(() => {
    if (formState.type !== "show") {
      return;
    }

    setFormState((current) => {
      if (current.type !== "show") {
        return current;
      }

      if (!current.releaseDate && current.availableVersions.length === 0) {
        return current;
      }

      return { ...current, releaseDate: "", availableVersions: [] };
    });
  }, [formState.type]);

  const openCreateModal = () => {
    setFormState(INITIAL_FORM);
    setFormError("");
    setPosterFile(null);
    setPosterPreview("");
    setEditingEvent(null);
    setNoticeMessage("");
    setIsCreateOpen(true);
  };

  const openEditModal = (eventItem) => {
    setEditingEvent(eventItem);
    setFormState({
      type: eventItem.type ?? "movie",
      name: eventItem.name ?? "",
      description: eventItem.description ?? "",
      trailerLink: eventItem.trailerLink ?? "",
      duration:
        typeof eventItem.duration === "number"
          ? String(eventItem.duration)
          : eventItem.duration ?? "",
      ageRestriction: eventItem.ageRestriction ?? "",
      genres: Array.isArray(eventItem.genres) ? eventItem.genres : [],
      availableVersions: Array.isArray(eventItem.availableVersions)
        ? eventItem.availableVersions
        : [],
      releaseDate: toDateInputValue(eventItem.releaseDate),
      directedBy: eventItem.directedBy ?? "",
      cast: Array.isArray(eventItem.cast) ? eventItem.cast.join(", ") : "",
      availableFrom: toDateInputValue(eventItem.availableFrom),
      availableTo: toDateInputValue(eventItem.availableTo),
      status: eventItem.status ?? "active",
    });
    setFormError("");
    setPosterFile(null);
    setPosterPreview(eventItem.poster || "");
    setIsEditOpen(true);
  };

  const closeFormModals = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setEditingEvent(null);
    setFormError("");
    setPosterFile(null);
    setPosterPreview("");
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleToggleGenre = (value) => {
    setFormState((current) => {
      const alreadySelected = current.genres.includes(value);

      return {
        ...current,
        genres: alreadySelected
          ? current.genres.filter((item) => item !== value)
          : [...current.genres, value],
      };
    });
  };

  const handleToggleVersion = (value) => {
    setFormState((current) => {
      const alreadySelected = current.availableVersions.includes(value);
      return {
        ...current,
        availableVersions: alreadySelected
          ? current.availableVersions.filter((item) => item !== value)
          : [...current.availableVersions, value],
      };
    });
  };

  const handlePosterChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setPosterFile(file);
  };

  const updateSearchParams = (updates) => {
    const params = new URLSearchParams(searchParams.toString());

    if (Object.prototype.hasOwnProperty.call(updates, "name")) {
      const value = updates.name?.trim();
      if (value) {
        params.set("name", value);
      } else {
        params.delete("name");
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, "type")) {
      const value = updates.type;
      if (value && value !== "Tous") {
        params.set("type", value);
      } else {
        params.delete("type");
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, "status")) {
      const value = updates.status;
      if (value && value !== "Tous") {
        params.set("status", value);
      } else {
        params.delete("status");
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, "page")) {
      params.set("page", String(updates.page));
    }

    const nextQuery = params.toString();
    router.push(nextQuery ? `/evenements?${nextQuery}` : "/evenements");
  };

  const handleSearch = () => {
    updateSearchParams({ name: query, page: 1 });
  };

  const handleTypeChange = (value) => {
    setTypeFilter(value);
    updateSearchParams({ type: value, page: 1 });
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    updateSearchParams({ status: value, page: 1 });
  };

  useEffect(() => {
    const nextQuery = searchParams.get("name") ?? "";
    const nextType = searchParams.get("type") || "Tous";
    const nextStatus = searchParams.get("status") || "Tous";

    setQuery(nextQuery);
    setTypeFilter(nextType);
    setStatusFilter(nextStatus);
  }, [searchParams]);

  const handleCreate = async (event) => {
    event.preventDefault();
    const name = formState.name.trim();

    if (!name) {
      setFormError("Le nom est obligatoire.");
      return;
    }

    setIsSaving(true);
    setNoticeMessage("");

    try {
      const formData = buildEventFormData(formState, posterFile);
      const result = await createEvent(formData);

      if (!result.ok) {
        setFormError(result.message || "Création impossible.");
        return;
      }

      closeFormModals();
      router.refresh();
    } catch {
      setFormError("Création impossible.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingEvent) {
      return;
    }

    const name = formState.name.trim();
    if (!name) {
      setFormError("Le nom est obligatoire.");
      return;
    }

    setIsSaving(true);
    setNoticeMessage("");

    try {
      const formData = buildEventFormData(formState, posterFile);
      const result = await updateEvent(editingEvent.id, formData);

      if (!result.ok) {
        setFormError(result.message || "Modification impossible.");
        return;
      }

      closeFormModals();
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
    setNoticeMessage("");

    try {
      const result = await deleteEvent(pendingDelete.id);

      if (!result.ok) {
        setErrorMessage(result.message || "Suppression impossible.");
        return;
      }

      setPendingDelete(null);
      setIsDeleteOpen(false);
      router.refresh();
    } catch {
      setErrorMessage("Suppression impossible.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const result = await seedEvents(20);

      if (!result.ok) {
        setErrorMessage(result.message || "Création impossible.");
        return;
      }

      setNoticeMessage(`Films créés: ${result.created}.`);
      router.refresh();
    } catch {
      setErrorMessage("Création impossible.");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-secondary text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
            Gestion des événements
          </h1>
          <p className="mt-1 text-slate-500">
            Gérez vos films, spectacles et calendriers d&apos;événements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary/90"
          >
            <Icon name="plus" className="h-5 w-5" />
            Ajouter un événement
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
      {noticeMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {noticeMessage}
        </div>
      ) : null}

      <EventFilters
        query={query}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        onTypeChange={handleTypeChange}
        onStatusChange={handleStatusChange}
      />

      <EventTable
        events={events}
        onDelete={(eventItem) => {
          setPendingDelete(eventItem);
          setIsDeleteOpen(true);
        }}
      />
      <EventPagination
        page={pagination.page}
        limit={pagination.limit}
        total={pagination.total}
        totalPages={pagination.totalPages}
        hasNext={pagination.hasNext}
        hasPrev={pagination.hasPrev}
      />

      {isCreateOpen ? (
        <EventFormModal
          title="Ajouter un événement"
          description="Remplissez les informations pour créer un nouvel événement."
          submitLabel="Ajouter l'événement"
          iconName="plus"
          isSubmitting={isSaving}
          formState={formState}
          formError={formError}
          posterPreview={posterPreview}
          showTypes={showTypes}
          showTypesError={showTypesError}
          onPosterChange={handlePosterChange}
          onToggleGenre={handleToggleGenre}
          onToggleVersion={handleToggleVersion}
          onInputChange={handleInputChange}
          onClose={closeFormModals}
          onSubmit={handleCreate}
        />
      ) : null}

      {isEditOpen ? (
        <EventFormModal
          title="Modifier l'événement"
          description="Mettez à jour les informations de l'événement."
          submitLabel="Enregistrer"
          iconName="pen"
          isSubmitting={isSaving}
          formState={formState}
          formError={formError}
          posterPreview={posterPreview}
          showTypes={showTypes}
          showTypesError={showTypesError}
          onPosterChange={handlePosterChange}
          onToggleGenre={handleToggleGenre}
          onToggleVersion={handleToggleVersion}
          onInputChange={handleInputChange}
          onClose={closeFormModals}
          onSubmit={handleUpdate}
        />
      ) : null}

      {isDeleteOpen ? (
        <ConfirmModal
          title="Supprimer l'événement"
          description={
            pendingDelete
              ? `Confirmer la suppression de "${pendingDelete.name}" ?`
              : ""
          }
          onCancel={() => {
            setIsDeleteOpen(false);
            setPendingDelete(null);
          }}
          onConfirm={handleDelete}
          isLoading={isDeleting}
        />
      ) : null}
    </div>
  );
}
