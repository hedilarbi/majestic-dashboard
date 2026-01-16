"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/ui/icons";
import Modal from "@/components/ui/modal";
import Toast from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import {
  createVersion,
  deleteVersion,
  updateVersion,
} from "@/services/versions-actions";

export default function VersionsClient({
  initialVersions = [],
  initialError = "",
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formName, setFormName] = useState("");
  const [formError, setFormError] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const { toast, showToast } = useToast();

  useEffect(() => {
    setErrorMessage(initialError || "");
  }, [initialError]);

  const sortedVersions = useMemo(
    () => [...initialVersions].sort((a, b) => a.name.localeCompare(b.name)),
    [initialVersions]
  );

  const openCreateModal = () => {
    setFormName("");
    setFormError("");
    setEditingItem(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormError("");
    setIsEditOpen(true);
  };

  const closeFormModals = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setEditingItem(null);
    setFormError("");
    setFormName("");
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const name = formName.trim();

    if (!name) {
      setFormError("Veuillez saisir un nom.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await createVersion({ name });

      if (!result.ok) {
        const message = result.message || "Création impossible.";
        setFormError(message);
        showToast(message, "error");
        return;
      }

      closeFormModals();
      showToast("Version créée avec succès.", "success");
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
    const name = formName.trim();

    if (!editingItem) {
      return;
    }

    if (!name) {
      setFormError("Veuillez saisir un nom.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateVersion({
        id: editingItem.id,
        name,
      });

      if (!result.ok) {
        setFormError(result.message || "Modification impossible.");
        return;
      }

      closeFormModals();
      showToast("Version modifiée avec succès.", "success");
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
      const result = await deleteVersion(pendingDelete.id);

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

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-secondary text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
              Versions
            </h1>
            <p className="text-slate-500 mt-1">
              Gère les versions disponibles pour les séances.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary/90"
            >
              <Icon name="plus" className="h-5 w-5" />
              Ajouter une version
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-secondary text-lg font-semibold text-slate-900">
                Liste des versions
              </h2>
              <p className="text-sm text-slate-500">
                {sortedVersions.length} versions disponibles
              </p>
            </div>
          </div>

          {sortedVersions.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              Aucune version pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Nom</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  {sortedVersions.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {item.name}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isCreateOpen ? (
          <Modal
            title="Ajouter une version"
            description="Renseigne le nom (ex: VO, VOSTFR, VF)."
            onClose={() => (isSaving ? null : closeFormModals())}
          >
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <label
                  htmlFor="create-name"
                  className="text-sm font-medium text-slate-700"
                >
                  Nom de la version
                </label>
                <input
                  id="create-name"
                  type="text"
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  placeholder="VO, VOSTFR, VF"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
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
            title="Modifier la version"
            description="Mets à jour le nom de la version."
            onClose={() => (isSaving ? null : closeFormModals())}
          >
            <form className="space-y-4" onSubmit={handleUpdate}>
              <div className="space-y-2">
                <label
                  htmlFor="edit-name"
                  className="text-sm font-medium text-slate-700"
                >
                  Nom de la version
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  placeholder="VO, VOSTFR, VF"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
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
            title="Supprimer la version"
            description={`Confirmer la suppression de "${pendingDelete.name}" ?`}
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
