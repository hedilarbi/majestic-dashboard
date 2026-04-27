"use client";

import Image from "next/image";

import Modal from "@/components/ui/modal";
import { Icon } from "@/components/ui/icons";
import FormQuestionsEditor from "@/components/blogue/form-questions-editor";
import RichTextEditor from "@/components/blogue/rich-text-editor";

const INPUT_CLASSES =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

const TEXTAREA_CLASSES = `${INPUT_CLASSES} min-h-28 resize-y`;

const PreviewImage = ({ src, alt }) =>
  src ? (
    <div className="relative h-40 w-full overflow-hidden rounded-2xl">
      <Image src={src} alt={alt} fill className="object-cover" unoptimized />
    </div>
  ) : (
    <div className="flex h-40 w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
      Aucun visuel
    </div>
  );

export default function BlogContentFormModal({
  typeMeta,
  mode = "create",
  formState,
  formError,
  isSubmitting,
  imagePreview,
  thumbnailPreview,
  onInputChange,
  onTogglePublished,
  onImageChange,
  onThumbnailChange,
  onQuestionsChange,
  onContentHtmlChange,
  onClose,
  onSubmit,
}) {
  const isArticle = typeMeta?.key === "article";
  const isTrailer = typeMeta?.key === "trailer";
  const isForm = typeMeta?.key === "form";

  return (
    <Modal
      title={
        mode === "edit"
          ? `Modifier ${typeMeta?.singular || "le contenu"}`
          : `Nouveau ${typeMeta?.singular || "contenu"}`
      }
      onClose={onClose}
      maxWidth="max-w-4xl"
      bodyClassName="max-h-[80vh] overflow-y-auto pr-1"
      containerClassName="p-0"
    >
      <form onSubmit={onSubmit} className="px-6 pb-6">
        <div className="space-y-6">
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Publication
              </p>
              <p className="text-xs text-slate-500">
                Activez pour rendre le contenu visible.
              </p>
            </div>
            <input
              type="checkbox"
              checked={formState.isPublished === true}
              onChange={onTogglePublished}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Titre
              </label>
              <input
                name="title"
                type="text"
                value={formState.title}
                onChange={onInputChange}
                className={INPUT_CLASSES}
                placeholder="Titre du contenu"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Accroche
              </label>
              <textarea
                name="excerpt"
                value={formState.excerpt}
                onChange={onInputChange}
                className={TEXTAREA_CLASSES}
                placeholder="Court texte d'introduction ou resume."
              />
            </div>
          </div>

          {isArticle ? (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Visuel principal
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 transition hover:border-primary/30 hover:bg-primary/5">
                  <Icon name="upload" className="h-5 w-5 text-primary" />
                  <span>Importer une image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={onImageChange}
                  />
                </label>
                <div className="mt-3">
                  <PreviewImage src={imagePreview} alt="Apercu de l'article" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Contenu
                </label>
                <RichTextEditor
                  value={formState.contentHtml}
                  onChange={onContentHtmlChange}
                  placeholder="Rédigez votre article avec mise en forme."
                />
              </div>
            </div>
          ) : null}

          {isTrailer ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  URL video
                </label>
                <input
                  name="videoUrl"
                  type="url"
                  value={formState.videoUrl}
                  onChange={onInputChange}
                  className={INPUT_CLASSES}
                  placeholder="https://..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Thumbnail
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 transition hover:border-primary/30 hover:bg-primary/5">
                  <Icon name="upload" className="h-5 w-5 text-primary" />
                  <span>Importer la miniature</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={onThumbnailChange}
                  />
                </label>
                <div className="mt-3">
                  <PreviewImage
                    src={thumbnailPreview}
                    alt="Apercu de la miniature"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {isForm ? (
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  name="formDescription"
                  value={formState.formDescription}
                  onChange={onInputChange}
                  className={TEXTAREA_CLASSES}
                  placeholder="Expliquez l'objectif du formulaire."
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-slate-700">
                  Questions
                </label>
                <FormQuestionsEditor
                  questions={formState.questions}
                  onChange={onQuestionsChange}
                />
              </div>
            </div>
          ) : null}

          {formError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Icon
                name={mode === "edit" ? "pen" : "plus"}
                className="h-4 w-4"
              />
              {isSubmitting
                ? "Enregistrement..."
                : mode === "edit"
                  ? "Enregistrer"
                  : "Créer"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
