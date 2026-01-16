"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/ui/icons";
import Modal from "@/components/ui/modal";
import Toast from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { TIME_PATTERN } from "@/lib/configurations/validators";
import {
  createSessionTime,
  deleteSessionTime,
  updateSessionTime,
} from "@/services/session-times-actions";

export default function HorairesSeancesClient({
  initialSessionTimes = [],
  initialError = "",
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formTime, setFormTime] = useState("");
  const [formError, setFormError] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const { toast, showToast } = useToast();

  useEffect(() => {
    setErrorMessage(initialError || "");
  }, [initialError]);

  const sortedSessionTimes = useMemo(
    () => [...initialSessionTimes].sort((a, b) => a.time.localeCompare(b.time)),
    [initialSessionTimes]
  );

  const openCreateModal = () => {
    setFormTime("");
    setFormError("");
    setEditingItem(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormTime(item.time);
    setFormError("");
    setIsEditOpen(true);
  };

  const closeFormModals = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setEditingItem(null);
    setFormError("");
    setFormTime("");
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const time = formTime.trim();

    if (!TIME_PATTERN.test(time)) {
      setFormError("Veuillez saisir un horaire valide (HH:mm).");
      return;
    }

    setIsSaving(true);

    try {
      const result = await createSessionTime({ time });

      if (!result.ok) {
        const message = result.message || "Création impossible.";
        setFormError(message);
        showToast(message, "error");
        return;
      }

      closeFormModals();
      showToast("Horaire créé avec succès.", "success");
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
    const time = formTime.trim();

    if (!editingItem) {
      return;
    }

    if (!TIME_PATTERN.test(time)) {
      setFormError("Veuillez saisir un horaire valide (HH:mm).");
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateSessionTime({
        id: editingItem.id,
        time,
      });

      if (!result.ok) {
        setFormError(result.message || "Modification impossible.");
        return;
      }

      closeFormModals();
      showToast("Horaire mis à jour avec succès.", "success");
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
      const result = await deleteSessionTime(pendingDelete.id);

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
              Horaires des séances
            </h1>
            <p className="text-slate-500 mt-1">
              Gère les horaires proposés pour les séances.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary/90"
            >
              <Icon name="plus" className="h-5 w-5" />
              Ajouter un horaire
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
                Liste des horaires
              </h2>
              <p className="text-sm text-slate-500">
                {sortedSessionTimes.length} horaires disponibles
              </p>
            </div>
          </div>

          {sortedSessionTimes.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              Aucun horaire pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Heure</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  {sortedSessionTimes.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {item.time}
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
            title="Ajouter un horaire"
            description="Définis l'heure au format HH:mm."
            onClose={() => (isSaving ? null : closeFormModals())}
          >
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <label
                  htmlFor="create-time"
                  className="text-sm font-medium text-slate-700"
                >
                  Horaire
                </label>
                <input
                  id="create-time"
                  type="time"
                  value={formTime}
                  onChange={(event) => setFormTime(event.target.value)}
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
            title="Modifier l'horaire"
            description="Mets à jour l'heure au format HH:mm."
            onClose={() => (isSaving ? null : closeFormModals())}
          >
            <form className="space-y-4" onSubmit={handleUpdate}>
              <div className="space-y-2">
                <label
                  htmlFor="edit-time"
                  className="text-sm font-medium text-slate-700"
                >
                  Horaire
                </label>
                <input
                  id="edit-time"
                  type="time"
                  value={formTime}
                  onChange={(event) => setFormTime(event.target.value)}
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
            title="Supprimer l'horaire"
            description={`Confirmer la suppression de l'horaire ${pendingDelete.time} ?`}
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
