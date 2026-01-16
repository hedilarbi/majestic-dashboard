"use client";

import Image from "next/image";

import { Icon } from "@/components/ui/icons";
import {
  GENRE_OPTIONS,
  INPUT_CLASSES,
  TEXTAREA_CLASSES,
  TYPE_OPTIONS,
  VERSION_OPTIONS,
} from "@/lib/evenements/helpers";

export default function EventFormModal({
  title,
  description,
  submitLabel,
  iconName,
  isSubmitting,
  formState,
  formError,
  posterPreview,
  showTypes = [],
  showTypesError = "",
  onPosterChange,
  onToggleGenre,
  onToggleVersion,
  onInputChange,
  onClose,
  onSubmit,
}) {
  const isShow = formState.type === "show";
  const showTypeOptions = Array.isArray(showTypes) ? showTypes : [];
  const genreOptions = isShow
    ? showTypeOptions
        .filter((item) => item?.name)
        .map((item) => ({
          value: item.name,
          label: item.name,
        }))
    : GENRE_OPTIONS;
  const selectedGenresLabel = (() => {
    if (!formState.genres.length) {
      return isShow
        ? "Sélectionner un type de spectacle"
        : "Sélectionner des genres";
    }

    const labels = formState.genres.map((genre) => {
      const match = genreOptions.find((option) => option.value === genre);
      return match ? match.label : genre;
    });

    if (labels.length <= 2) {
      return labels.join(", ");
    }

    return `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`;
  })();
  const nameLabel = isShow ? "Nom du spectacle" : "Nom du film";
  const genresLabel = isShow ? "Type de spectacle" : "Genres";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-white/20 fade-up"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary flex items-center justify-center">
              <Icon name={iconName} className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-secondary text-xl font-semibold text-slate-900 leading-tight">
                {title}
              </h2>
              <p className="text-sm text-slate-500">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
            aria-label="Fermer"
          >
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>
        <form
          className="flex-1 flex flex-col min-h-0"
          onSubmit={onSubmit}
          encType="multipart/form-data"
        >
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-2/5 flex flex-col gap-3">
                  <label className="block text-sm font-medium text-slate-900">
                    Affiche de l&apos;événement
                  </label>
                  <div className="relative h-96 sm:h-[30rem]">
                    <label
                      htmlFor="event-poster"
                      className="group relative h-full w-full flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-primary/5 hover:border-primary/50 transition cursor-pointer overflow-hidden"
                    >
                      {posterPreview ? (
                        <>
                          <Image
                            src={posterPreview}
                            alt="Aperçu de l'affiche"
                            fill
                            sizes="(min-width: 1024px) 50vw, 90vw"
                            className="object-cover"
                            unoptimized
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-slate-900/40 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            Remplacer l&apos;affiche
                          </span>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-3 text-center px-6">
                          <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-primary">
                            <Icon name="upload" className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-slate-900 font-semibold">
                              Cliquer pour importer
                            </p>
                            <p className="text-slate-500 text-xs mt-1">
                              JPG, PNG ou WEBP (max 5 MB)
                              <br />
                              Format recommandé : 2:3
                            </p>
                          </div>
                        </div>
                      )}
                    </label>
                    <input
                      id="event-poster"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={onPosterChange}
                    />
                  </div>
                </div>
                <div className="w-full lg:flex-1 flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Type
                    </label>
                    <div className="relative">
                      <select
                        name="type"
                        value={formState.type}
                        onChange={onInputChange}
                        className={`${INPUT_CLASSES} appearance-none pr-10`}
                      >
                        {TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <Icon name="chevronDown" className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      {nameLabel}
                    </label>
                    <input
                      name="name"
                      type="text"
                      value={formState.name}
                      onChange={onInputChange}
                      placeholder="Ex : Le Parrain"
                      className={INPUT_CLASSES}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      {genresLabel}
                    </label>
                    <details className="relative">
                      <summary
                        className={`${INPUT_CLASSES} flex items-center justify-between cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
                      >
                        <span
                          className={
                            formState.genres.length
                              ? "text-slate-900"
                              : "text-slate-400"
                          }
                        >
                          {selectedGenresLabel}
                        </span>
                        <Icon
                          name="chevronDown"
                          className="h-4 w-4 text-slate-400"
                        />
                      </summary>
                      <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg p-3 max-h-56 overflow-auto">
                        {genreOptions.map((option) => {
                          const isSelected = formState.genres.includes(
                            option.value
                          );

                          return (
                            <label
                              key={option.value}
                              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 cursor-pointer text-sm text-slate-700"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onToggleGenre(option.value)}
                                className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40"
                              />
                              {option.label}
                            </label>
                          );
                        })}
                      </div>
                    </details>
                    {isShow && showTypesError ? (
                      <p className="mt-2 text-xs text-amber-600">
                        {showTypesError}
                      </p>
                    ) : null}
                    {isShow && !showTypesError && genreOptions.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Aucun type de spectacle disponible.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div
                className={`grid grid-cols-1 gap-6 ${
                  isShow ? "" : "md:grid-cols-2"
                }`}
              >
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Durée (minutes)
                  </label>
                  <div className="relative">
                    <input
                      name="duration"
                      type="number"
                      min="0"
                      value={formState.duration}
                      onChange={onInputChange}
                      placeholder="Ex : 124"
                      className={`${INPUT_CLASSES} pr-12`}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 text-xs font-semibold">
                      min
                    </span>
                  </div>
                </div>
                {!isShow ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Date de sortie
                    </label>
                    <input
                      name="releaseDate"
                      type="date"
                      value={formState.releaseDate}
                      onChange={onInputChange}
                      className={INPUT_CLASSES}
                    />
                  </div>
                ) : null}
              </div>

              {!isShow ? (
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-3">
                    Versions disponibles
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {VERSION_OPTIONS.map((option) => {
                      const isActive = formState.availableVersions.includes(
                        option.value
                      );

                      return (
                        <button
                          type="button"
                          aria-pressed={isActive}
                          key={option.value}
                          onClick={() => onToggleVersion(option.value)}
                          className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                            isActive
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Lien du trailer
                  </label>
                  <input
                    name="trailerLink"
                    type="url"
                    value={formState.trailerLink}
                    onChange={onInputChange}
                    placeholder="https://"
                    className={INPUT_CLASSES}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Restriction d&apos;âge
                  </label>
                  <input
                    name="ageRestriction"
                    type="text"
                    value={formState.ageRestriction}
                    onChange={onInputChange}
                    placeholder="Ex : 12+"
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Réalisé par
                </label>
                <input
                  name="directedBy"
                  type="text"
                  value={formState.directedBy}
                  onChange={onInputChange}
                  placeholder="Nom du réalisateur"
                  className={INPUT_CLASSES}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Casting
                </label>
                <input
                  name="cast"
                  type="text"
                  value={formState.cast}
                  onChange={onInputChange}
                  placeholder="Noms séparés par des virgules"
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Disponible à partir du
                  </label>
                  <input
                    name="availableFrom"
                    type="date"
                    value={formState.availableFrom}
                    onChange={onInputChange}
                    className={INPUT_CLASSES}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Disponible jusqu&apos;au
                  </label>
                  <input
                    name="availableTo"
                    type="date"
                    value={formState.availableTo}
                    onChange={onInputChange}
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Synopsis
                </label>
                <textarea
                  name="description"
                  value={formState.description}
                  onChange={onInputChange}
                  placeholder="Ajoutez un résumé du film ou de l'événement..."
                  className={TEXTAREA_CLASSES}
                />
              </div>

              {formError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {formError}
                </div>
              ) : null}

            </div>
          </div>
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold shadow-md shadow-primary/20 transition-all flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Icon name="check" className="h-4 w-4" />
              {isSubmitting ? "Enregistrement..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
