"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/ui/icons";
import EventFormModal from "@/components/evenements/event-form-modal";
import { updateEvent } from "@/services/evenements-actions";
import {
  GENRE_OPTIONS,
  buildEventFormData,
  toDateInputValue,
} from "@/lib/evenements/helpers";

const buildFormStateFromEvent = (event) => ({
  type: event?.type ?? "movie",
  name: event?.name ?? "",
  description: event?.description ?? "",
  trailerLink: event?.trailerLink ?? "",
  duration:
    typeof event?.duration === "number"
      ? String(event.duration)
      : event?.duration ?? "",
  ageRestriction: event?.ageRestriction ?? "",
  genres: Array.isArray(event?.genres) ? event.genres : [],
  availableVersions: Array.isArray(event?.availableVersions)
    ? event.availableVersions
    : [],
  releaseDate: toDateInputValue(event?.releaseDate),
  directedBy: event?.directedBy ?? "",
  cast: Array.isArray(event?.cast) ? event.cast.join(", ") : "",
  availableFrom: toDateInputValue(event?.availableFrom),
  availableTo: toDateInputValue(event?.availableTo),
  status: event?.status ?? "active",
});

export default function EventEditTrigger({
  event,
  showTypes = [],
  showTypesError = "",
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState(() =>
    buildFormStateFromEvent(event)
  );
  const [formError, setFormError] = useState("");
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(event?.poster || "");

  const showTypeNames = useMemo(
    () => showTypes.map((item) => item?.name).filter(Boolean),
    [showTypes]
  );
  const movieGenreValues = useMemo(
    () => GENRE_OPTIONS.map((option) => option.value),
    []
  );

  useEffect(() => {
    if (!posterFile) {
      return undefined;
    }

    const previewUrl = URL.createObjectURL(posterFile);
    setPosterPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [posterFile]);

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

  const openModal = () => {
    setFormState(buildFormStateFromEvent(event));
    setPosterFile(null);
    setPosterPreview(event?.poster || "");
    setFormError("");
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setFormError("");
    setPosterFile(null);
  };

  const handleInputChange = (eventInput) => {
    const { name, value } = eventInput.target;
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

  const handlePosterChange = (eventInput) => {
    const file = eventInput.target.files?.[0];
    if (!file) {
      return;
    }

    setPosterFile(file);
  };

  const handleSubmit = async (eventInput) => {
    eventInput.preventDefault();

    if (!event?.id) {
      setFormError("Identifiant manquant.");
      return;
    }

    const formData = buildEventFormData(formState, posterFile);

    setIsSaving(true);

    try {
      const result = await updateEvent(event.id, formData);

      if (!result.ok) {
        const message = result.message || "Modification impossible.";
        setFormError(message);
        return;
      }

      closeModal();
      router.refresh();
    } catch {
      setFormError("Modification impossible.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
      >
        <Icon name="pen" className="h-4 w-4" />
        Modifier l&apos;événement
      </button>

      {isOpen ? (
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
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      ) : null}
    </>
  );
}
