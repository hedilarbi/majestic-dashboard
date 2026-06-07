"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Icon } from "@/components/ui/icons";
import Modal from "@/components/ui/modal";
import Toast from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useDashboardModulePermissions } from "@/hooks/use-dashboard-permissions";
const INPUT_CLASSES =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

const IMAGE_ASPECT_OPTIONS = [
  { value: "vertical", label: "Verticale", ratio: "1/2" },
  { value: "horizontal", label: "Horizontale", ratio: "2/1" },
];

const resolveImageAspect = (value) =>
  value === "vertical" ? "vertical" : "horizontal";

const getImageAspectRatio = (value) =>
  resolveImageAspect(value) === "vertical" ? "1 / 2" : "2 / 1";

const getImagePreviewWidthClass = (value) =>
  resolveImageAspect(value) === "vertical" ? "w-28" : "w-56";

const getTableImageClass = (value) =>
  resolveImageAspect(value) === "vertical" ? "h-16 w-8" : "h-10 w-20";

const sortPartners = (items = []) =>
  [...items].sort(
    (left, right) =>
      (Number(left?.order) || 0) - (Number(right?.order) || 0) ||
      String(left?.name || "").localeCompare(String(right?.name || ""), "fr"),
  );

const callApi = async (method, path, body, isFormData = false) => {
  const opts = {
    method,
    headers: isFormData ? {} : { "Content-Type": "application/json", Accept: "application/json" },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  };
  if (!isFormData) opts.headers.Accept = "application/json";
  const res = await fetch(`/api/partners-proxy${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
};

export default function PartenairesClient({ initialPartners = [], initialError = "" }) {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const permissions = useDashboardModulePermissions("home_hero");

  const [partners, setPartners] = useState(initialPartners);
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formState, setFormState] = useState({
    name: "",
    order: "0",
    imageAspect: "horizontal",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setFormState({ name: "", order: "0", imageAspect: "horizontal" });
    setImageFile(null);
    setImagePreview("");
    setFormError("");
    setEditingItem(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreate = () => { resetForm(); setIsCreateOpen(true); };
  const openEdit = (item) => {
    setEditingItem(item);
    setFormState({
      name: item.name || "",
      order: String(item.order ?? 0),
      imageAspect: resolveImageAspect(item.imageAspect),
    });
    setImagePreview(item.image || "");
    setImageFile(null);
    setFormError("");
    setIsEditOpen(true);
  };
  const closeModals = () => { setIsCreateOpen(false); setIsEditOpen(false); resetForm(); };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("name", formState.name.trim());
    fd.append("order", formState.order || "0");
    fd.append("imageAspect", resolveImageAspect(formState.imageAspect));
    if (imageFile) fd.append("image", imageFile);
    return fd;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formState.name.trim()) { setFormError("Le nom est obligatoire."); return; }
    setIsSaving(true);
    try {
      const res = await fetch("/api/partners-proxy", { method: "POST", body: buildFormData() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setFormError(data?.message || "Création impossible."); return; }
      if (data?.partner) {
        setPartners((current) => sortPartners([data.partner, ...current]));
      }
      closeModals();
      showToast("Partenaire créé.", "success");
      router.refresh();
    } catch { setFormError("Erreur réseau."); }
    finally { setIsSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formState.name.trim()) { setFormError("Le nom est obligatoire."); return; }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/partners-proxy/${editingItem._id}`, { method: "PUT", body: buildFormData() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setFormError(data?.message || "Modification impossible."); return; }
      if (data?.partner) {
        setPartners((current) =>
          sortPartners(
            current.map((item) =>
              item._id === data.partner._id ? data.partner : item,
            ),
          ),
        );
      }
      closeModals();
      showToast("Partenaire modifié.", "success");
      router.refresh();
    } catch { setFormError("Erreur réseau."); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/partners-proxy/${pendingDelete._id}`, { method: "DELETE" });
      if (!res.ok) { showToast("Suppression impossible.", "error"); return; }
      setPartners((current) =>
        current.filter((item) => item._id !== pendingDelete._id),
      );
      setPendingDelete(null);
      showToast("Partenaire supprimé.", "success");
      router.refresh();
    } catch { showToast("Erreur réseau.", "error"); }
    finally { setIsDeleting(false); }
  };

  const FormFields = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Nom</label>
        <input name="name" value={formState.name} onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))} className={INPUT_CLASSES} placeholder="Nom du partenaire" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Ordre d&apos;affichage</label>
        <input name="order" type="number" min="0" value={formState.order} onChange={(e) => setFormState((s) => ({ ...s, order: e.target.value }))} className={INPUT_CLASSES} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Aspect de la photo</label>
        <div className="grid grid-cols-2 gap-2">
          {IMAGE_ASPECT_OPTIONS.map((option) => {
            const isSelected = resolveImageAspect(formState.imageAspect) === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setFormState((state) => ({
                    ...state,
                    imageAspect: option.value,
                  }))
                }
                className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                  isSelected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="block font-semibold">{option.label}</span>
                <span className="text-xs text-slate-400">Ratio {option.ratio}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Photo du partenaire</label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`group relative mx-auto block overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-primary hover:bg-primary/5 ${getImagePreviewWidthClass(formState.imageAspect)}`}
          style={{ aspectRatio: getImageAspectRatio(formState.imageAspect) }}
        >
          {imagePreview ? (
            <Image
              src={imagePreview}
              alt="Aperçu partenaire"
              fill
              className="object-contain p-2"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 group-hover:text-primary">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m-4 4h8M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
	              <span className="text-xs font-medium">Choisir une photo</span>
            </div>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="sr-only"
        />
        {imagePreview ? (
          <p className="text-center text-xs text-slate-400">Cliquer sur l&apos;image pour changer</p>
        ) : null}
      </div>
      {formError ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div> : null}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={closeModals} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50" disabled={isSaving}>Annuler</button>
        <button type="submit" disabled={isSaving} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 disabled:opacity-70">{isSaving ? "Enregistrement..." : "Enregistrer"}</button>
      </div>
    </div>
  );

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Partenaires</h1>
            <p className="text-slate-500 mt-1">Gérez les partenaires affichés sur la page d&apos;accueil.</p>
          </div>
          {permissions.canCreate ? (
            <button type="button" onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90">
              <Icon name="plus" className="h-5 w-5" />
              Ajouter
            </button>
          ) : null}
        </div>

        {errorMessage ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div> : null}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
              <tr>
	                <th className="px-6 py-4">Photo</th>
                <th className="px-6 py-4">Nom</th>
                <th className="px-6 py-4">Ordre</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {partners.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-slate-400">Aucun partenaire pour le moment.</td></tr>
              ) : partners.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {p.image ? (
	                      <div className={`relative overflow-hidden rounded border border-slate-100 ${getTableImageClass(p.imageAspect)}`}>
	                        <Image src={p.image} alt={p.name} fill className="object-contain" />
	                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                  <td className="px-6 py-4">{p.order ?? 0}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {permissions.canUpdate ? (
                        <button type="button" onClick={() => openEdit(p)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary hover:bg-primary/10">
                          <Icon name="pen" className="h-4 w-4" />
                        </button>
                      ) : null}
                      {permissions.canDelete ? (
                        <button type="button" onClick={() => setPendingDelete(p)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50">
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateOpen && permissions.canCreate ? (
        <Modal title="Ajouter un partenaire" onClose={closeModals}>
          <form onSubmit={handleCreate}>{FormFields}</form>
        </Modal>
      ) : null}

      {isEditOpen && permissions.canUpdate ? (
        <Modal title="Modifier le partenaire" onClose={closeModals}>
          <form onSubmit={handleUpdate}>{FormFields}</form>
        </Modal>
      ) : null}

      {pendingDelete ? (
        <Modal title="Supprimer le partenaire" description={`Supprimer "${pendingDelete.name}" ?`} onClose={() => setPendingDelete(null)}>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setPendingDelete(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50" disabled={isDeleting}>Annuler</button>
            <button type="button" onClick={handleDelete} disabled={isDeleting} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-70">{isDeleting ? "..." : "Supprimer"}</button>
          </div>
        </Modal>
      ) : null}

      <Toast toast={toast} />
    </>
  );
}
