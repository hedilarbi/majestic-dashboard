"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import BlogContentFormModal from "@/components/blogue/blog-content-form-modal";
import ConfirmModal from "@/components/ui/confirm-modal";
import Toast from "@/components/ui/toast";
import { Icon } from "@/components/ui/icons";
import { useToast } from "@/hooks/use-toast";
import { BLOG_CONTENT_TYPES } from "@/lib/blogue/constants";
import {
  createEmptyBlogFormState,
  normalizeBlogContent,
} from "@/lib/blogue/normalize";
import {
  createBlogContent,
  deleteBlogContent,
  updateBlogContent,
} from "@/services/blog-contents-actions";

const formatDateTime = (value) => {
  if (!value) {
    return "Date indisponible";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date indisponible";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getMeta = (type) => BLOG_CONTENT_TYPES[type] || BLOG_CONTENT_TYPES.article;

const hasRichTextContent = (value) =>
  String(value || "")
    .replace(/<p><\/p>/g, "")
    .replace(/<p><br><\/p>/g, "")
    .replace(/&nbsp;/g, "")
    .replace(/<[^>]+>/g, "")
    .trim().length > 0;

const buildFormStateFromItem = (type, item) => ({
  ...createEmptyBlogFormState(type),
  title: item?.title || "",
  excerpt: item?.excerpt || "",
  seoTitle: item?.seoTitle || "",
  seoDescription: item?.seoDescription || "",
  isPublished: item?.isPublished !== false,
  image: item?.image || "",
  images: Array.isArray(item?.images) ? item.images : [],
  imageFiles: [],
  contentHtml: item?.contentHtml || "",
  videoUrl: item?.videoUrl || "",
  thumbnail: item?.thumbnail || "",
  formDescription: item?.formDescription || "",
  questions: Array.isArray(item?.questions) ? item.questions : [],
});

const buildSummary = (item, type) => {
  if (type === "article") {
    return item?.excerpt || "Article de blogue";
  }

  if (type === "trailer") {
    return item?.videoUrl || "Lien video non renseigne";
  }

  const count = Array.isArray(item?.questions) ? item.questions.length : 0;
  return `${count} question${count > 1 ? "s" : ""}`;
};

export default function BlogContentManager({
  type,
  initialItems = [],
  initialError = "",
  permissions = {},
}) {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const typeMeta = getMeta(type);
  const [items, setItems] = useState(initialItems);
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [formState, setFormState] = useState(createEmptyBlogFormState(type));
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [albumPreviews, setAlbumPreviews] = useState([]);
  const canCreate = permissions.canCreate !== false;
  const canUpdate = permissions.canUpdate !== false;
  const canDelete = permissions.canDelete !== false;
  const canShowActions = canUpdate || canDelete;

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    setErrorMessage(initialError || "");
  }, [initialError]);

  const sortedItems = useMemo(
    () =>
      [...items].sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0),
      ),
    [items],
  );

  const resetForm = () => {
    setFormState(createEmptyBlogFormState(type));
    setFormError("");
    setEditingItem(null);
    setImagePreview("");
    setThumbnailPreview("");
    setAlbumPreviews([]);
  };

  const openCreateModal = () => {
    if (!canCreate) {
      return;
    }

    resetForm();
    setIsCreateOpen(true);
  };

  const openEditModal = (item) => {
    if (!canUpdate) {
      return;
    }

    const normalized = normalizeBlogContent(item);
    setEditingItem(normalized);
    setFormState(buildFormStateFromItem(type, normalized));
    setImagePreview(normalized?.image || "");
    setThumbnailPreview(normalized?.thumbnail || "");
    setAlbumPreviews(normalized?.images || []);
    setFormError("");
  };

  const closeModal = () => {
    setIsCreateOpen(false);
    resetForm();
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handlePublishedToggle = (event) => {
    setFormState((current) => ({
      ...current,
      isPublished: event.target.checked,
    }));
  };

  const handleFilePreview = (file) =>
    file ? URL.createObjectURL(file) : "";

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setFormState((current) => ({ ...current, imageFile: file }));
    setImagePreview(file ? handleFilePreview(file) : formState.image || "");
  };

  const handleThumbnailChange = (event) => {
    const file = event.target.files?.[0] || null;
    setFormState((current) => ({ ...current, thumbnailFile: file }));
    setThumbnailPreview(
      file ? handleFilePreview(file) : formState.thumbnail || "",
    );
  };

  const handleAlbumImagesChange = (event) => {
    const newFiles = Array.from(event.target.files || []);
    if (!newFiles.length) return;
    setFormState((current) => ({
      ...current,
      imageFiles: [...(current.imageFiles || []), ...newFiles],
    }));
    setAlbumPreviews((current) => [
      ...current,
      ...newFiles.map((f) => URL.createObjectURL(f)),
    ]);
    event.target.value = "";
  };

  const handleAlbumImageRemove = (index) => {
    const existingCount = (formState.images || []).length;
    if (index < existingCount) {
      setFormState((current) => ({
        ...current,
        images: current.images.filter((_, i) => i !== index),
      }));
    } else {
      const fileIndex = index - existingCount;
      setFormState((current) => ({
        ...current,
        imageFiles: current.imageFiles.filter((_, i) => i !== fileIndex),
      }));
    }
    setAlbumPreviews((current) => current.filter((_, i) => i !== index));
  };

  const buildPayload = () => {
    const payload = new FormData();

    payload.set("type", type);
    payload.set("title", formState.title.trim());
    payload.set("excerpt", formState.excerpt.trim());
    payload.set("isPublished", String(formState.isPublished === true));
    payload.set("seoTitle", formState.seoTitle?.trim() || "");
    payload.set("seoDescription", formState.seoDescription?.trim() || "");

    if (type === "article") {
      payload.set("contentHtml", formState.contentHtml || "");

      if (formState.imageFile) {
        payload.set("image", formState.imageFile);
      } else if (formState.image) {
        payload.set("image", formState.image);
      }

      if (formState.thumbnailFile) {
        payload.set("thumbnail", formState.thumbnailFile);
      } else if (formState.thumbnail) {
        payload.set("thumbnail", formState.thumbnail);
      }

      (formState.images || []).forEach((url) => payload.append("images", url));
      (formState.imageFiles || []).forEach((file) => payload.append("images", file));
    }

    if (type === "trailer") {
      payload.set("videoUrl", formState.videoUrl.trim());

      if (formState.thumbnailFile) {
        payload.set("thumbnail", formState.thumbnailFile);
      } else if (formState.thumbnail) {
        payload.set("thumbnail", formState.thumbnail);
      }
    }

    if (type === "form") {
      payload.set("formDescription", formState.formDescription.trim());
      payload.set("questions", JSON.stringify(formState.questions || []));

      if (formState.imageFile) {
        payload.set("image", formState.imageFile);
      } else if (formState.image) {
        payload.set("image", formState.image);
      }

      if (formState.thumbnailFile) {
        payload.set("thumbnail", formState.thumbnailFile);
      } else if (formState.thumbnail) {
        payload.set("thumbnail", formState.thumbnail);
      }
    }

    return payload;
  };

  const validateForm = () => {
    if (!formState.title.trim()) {
      return "Le titre est obligatoire.";
    }

    if (type === "article") {
      if (!formState.imageFile && !formState.image) {
        return "Ajoutez l'image principale de l'article.";
      }

      if (!hasRichTextContent(formState.contentHtml)) {
        return "Le contenu de l'article est obligatoire.";
      }
    }

    if (type === "trailer") {
      if (!formState.videoUrl.trim()) {
        return "L'URL video est obligatoire.";
      }

      if (!formState.thumbnailFile && !formState.thumbnail) {
        return "Ajoutez la miniature de la bande-annonce.";
      }
    }

    if (type === "form") {
      if (!Array.isArray(formState.questions) || !formState.questions.length) {
        return "Ajoutez au moins une question.";
      }
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const payload = buildPayload();
      if (editingItem && !canUpdate) {
        setFormError("Vous n'avez pas la permission de modifier ce contenu.");
        return;
      }

      if (!editingItem && !canCreate) {
        setFormError("Vous n'avez pas la permission de créer ce contenu.");
        return;
      }

      const result = editingItem
        ? await updateBlogContent(editingItem.id, payload)
        : await createBlogContent(payload);

      if (!result?.ok) {
        setFormError(result?.message || "Enregistrement impossible.");
        return;
      }

      const nextItem = normalizeBlogContent(result.item);
      setItems((current) => {
        if (!nextItem) {
          return current;
        }

        if (editingItem) {
          return current.map((item) =>
            item.id === editingItem.id ? nextItem : item,
          );
        }

        return [nextItem, ...current];
      });

      closeModal();
      router.refresh();
      showToast(
        editingItem
          ? `${typeMeta.singular} mis a jour.`
          : `${typeMeta.singular} créé avec succès.`,
        "success",
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message.toLowerCase() : "";
      const isUploadTooLarge =
        errorMessage.includes("body exceeded") ||
        errorMessage.includes("payload too large") ||
        errorMessage.includes("request entity too large");

      setFormError(
        isUploadTooLarge
          ? "Les images sont trop volumineuses. Réduisez leur taille puis réessayez."
          : "Une erreur est survenue. Merci de réessayer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete?.id) {
      return;
    }

    if (!canDelete) {
      showToast("Vous n'avez pas la permission de supprimer ce contenu.", "error");
      return;
    }

    setIsDeleting(true);

    try {
      const result = await deleteBlogContent(pendingDelete.id);

      if (!result?.ok) {
        showToast(result?.message || "Suppression impossible.", "error");
        return;
      }

      setItems((current) =>
        current.filter((item) => item.id !== pendingDelete.id),
      );
      setPendingDelete(null);
      router.refresh();
      showToast(`${typeMeta.singular} supprimé.`, "success");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/80 p-6 shadow-[0_24px_80px_-50px_rgba(15,42,120,0.5)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/70">
            Gestion
          </p>
          <h1 className="mt-2 font-secondary text-3xl font-semibold text-slate-900">
            {typeMeta.label}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Liste, création, modification et suppression des {typeMeta.label.toLowerCase()}.
          </p>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            <Icon name="plus" className="h-4 w-4" />
            Nouveau {typeMeta.singular}
          </button>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_24px_60px_-45px_rgba(15,42,120,0.45)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Titre
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Apercu
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Statut
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-700">
                  Mise à jour
                </th>
                {canShowActions ? (
                  <th className="px-6 py-4 text-right font-semibold text-slate-700">
                    Actions
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedItems.length ? (
                sortedItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 align-top">
                      <div className="font-semibold text-slate-900">
                        {item.title}
                      </div>
                      {item.slug ? (
                        <div className="mt-1 text-xs text-slate-400">
                          /{item.slug}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 align-top text-slate-600">
                      {buildSummary(item, type)}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          item.isPublished
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.isPublished ? "Publie" : "Brouillon"}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top text-slate-600">
                      <div>{formatDateTime(item.updatedAt)}</div>
                      {item.updatedByName ? (
                        <div className="mt-1 text-xs text-slate-400">
                          {item.updatedByName}
                        </div>
                      ) : null}
                    </td>
                    {canShowActions ? (
                      <td className="px-6 py-4 align-top">
                        <div className="flex justify-end gap-2">
                          {canUpdate ? (
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                            >
                              <Icon name="pen" className="h-4 w-4" />
                              Modifier
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => setPendingDelete(item)}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              <Icon name="trash" className="h-4 w-4" />
                              Supprimer
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={canShowActions ? 5 : 4}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    {typeMeta.emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(isCreateOpen || editingItem) && (
        <BlogContentFormModal
          typeMeta={typeMeta}
          mode={editingItem ? "edit" : "create"}
          formState={formState}
          formError={formError}
          isSubmitting={isSubmitting}
          imagePreview={imagePreview || formState.image}
          thumbnailPreview={thumbnailPreview || formState.thumbnail}
          albumPreviews={albumPreviews}
          onInputChange={handleInputChange}
          onTogglePublished={handlePublishedToggle}
          onImageChange={handleImageChange}
          onThumbnailChange={handleThumbnailChange}
          onAlbumImagesChange={handleAlbumImagesChange}
          onAlbumImageRemove={handleAlbumImageRemove}
          onQuestionsChange={(questions) =>
            setFormState((current) => ({ ...current, questions }))
          }
          onContentHtmlChange={(contentHtml) =>
            setFormState((current) => ({ ...current, contentHtml }))
          }
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}

      {pendingDelete ? (
        <ConfirmModal
          title={`Supprimer ${typeMeta.singular}`}
          description={`Voulez-vous vraiment supprimer "${pendingDelete.title}" ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          isLoading={isDeleting}
          onCancel={() => (isDeleting ? null : setPendingDelete(null))}
          onConfirm={handleDelete}
        />
      ) : null}

      <Toast toast={toast} />
    </section>
  );
}
