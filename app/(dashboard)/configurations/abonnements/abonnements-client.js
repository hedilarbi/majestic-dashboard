"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/ui/icons";
import Modal from "@/components/ui/modal";
import ConfirmModal from "@/components/ui/confirm-modal";
import Toast from "@/components/ui/toast";
import { useDashboardModulePermissions } from "@/hooks/use-dashboard-permissions";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/configurations/formatters";
import { formatDate, toDateInputValue } from "@/lib/evenements/helpers";
import {
  createSubscription,
  deleteSubscription,
  updateSubscription,
} from "@/services/subscriptions-actions";

const INPUT_CLASSES =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

const STATUS_LABELS = {
  active: "Actif",
  inactive: "Inactif",
};

const ALLOWED_SEAT_TYPE_OPTIONS = [
  { value: "normale", label: "Siège normal" },
  { value: "tarif_fixe", label: "Siège tarif fixe (VIP)" },
];

const createEmptyForm = () => ({
  name: "",
  price: "",
  totalCredits: "",
  maxSeatsPerSession: "1",
  allowedSeatType: "normale",
  expirationDate: "",
  description: "",
  isActive: true,
});

export default function AbonnementsClient({
  initialSubscriptions = [],
  initialError = "",
}) {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const permissions = useDashboardModulePermissions("subscriptions");
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState("");
  const [formState, setFormState] = useState(createEmptyForm);
  const [formError, setFormError] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    setErrorMessage(initialError || "");
  }, [initialError]);

  const sortedSubscriptions = useMemo(() => {
    return [...initialSubscriptions].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""))
    );
  }, [initialSubscriptions]);

  const openCreateModal = () => {
    setFormState(createEmptyForm());
    setFormError("");
    setEditingItem(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormState({
      name: item.name || "",
      price: Number.isFinite(item.price) ? String(item.price) : item.price ?? "",
      totalCredits: Number.isFinite(item.totalCredits)
        ? String(item.totalCredits)
        : item.totalCredits ?? "",
      maxSeatsPerSession: Number.isFinite(item.maxSeatsPerSession)
        ? String(item.maxSeatsPerSession)
        : "1",
      allowedSeatType: item.allowedSeatType || "normale",
      expirationDate: toDateInputValue(item.expirationDate),
      description: item.description || "",
      isActive: item.isActive !== false,
    });
    setFormError("");
    setIsEditOpen(true);
  };

  const closeModals = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setFormError("");
    setEditingItem(null);
    setFormState(createEmptyForm());
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const normalizeNumberInput = (value) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value !== "string") {
      return null;
    }

    if (!value.trim()) {
      return null;
    }

    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  };

  const normalizeDateInput = (value) => {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  };

  const buildPayload = () => {
    const name = formState.name.trim();
    const description = formState.description.trim();
    const price = normalizeNumberInput(formState.price);
    const totalCredits = normalizeNumberInput(formState.totalCredits);
    const maxSeatsPerSession = normalizeNumberInput(formState.maxSeatsPerSession);
    const expirationDate = normalizeDateInput(formState.expirationDate);
    const allowedSeatType = formState.allowedSeatType || "normale";

    if (!name) {
      return { ok: false, message: "Veuillez saisir un nom." };
    }

    if (price === null) {
      return { ok: false, message: "Veuillez saisir un prix valide." };
    }

    if (totalCredits === null) {
      return { ok: false, message: "Veuillez saisir un nombre de crédits valide." };
    }

    if (maxSeatsPerSession === null || maxSeatsPerSession < 1) {
      return { ok: false, message: "Veuillez saisir une limite de sièges par séance valide (min. 1)." };
    }

    if (!expirationDate) {
      return { ok: false, message: "Veuillez saisir une date d'expiration valide." };
    }

    return {
      ok: true,
      payload: {
        name,
        description,
        price,
        totalCredits,
        maxSeatsPerSession,
        allowedSeatType,
        expirationDate,
        isActive: Boolean(formState.isActive),
      },
    };
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const result = buildPayload();

    if (!result.ok) {
      setFormError(result.message || "Création impossible.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await createSubscription(result.payload);

      if (!response.ok) {
        const message = response.message || "Création impossible.";
        setFormError(message);
        showToast(message, "error");
        return;
      }

      closeModals();
      showToast("Abonnement créé avec succès.", "success");
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

    const result = buildPayload();

    if (!result.ok) {
      setFormError(result.message || "Modification impossible.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await updateSubscription({
        id: editingItem.id,
        ...result.payload,
      });

      if (!response.ok) {
        setFormError(response.message || "Modification impossible.");
        return;
      }

      closeModals();
      showToast("Abonnement modifié avec succès.", "success");
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
      const result = await deleteSubscription(pendingDelete.id);

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

  const handleToggleStatus = async (item) => {
    if (!item?.id) {
      return;
    }

    const nextIsActive = !(item.isActive !== false);

    setStatusUpdatingId(item.id);

    try {
      const result = await updateSubscription({
        id: item.id,
        name: item.name,
        price: item.price,
        totalCredits: item.totalCredits,
        maxSeatsPerSession: item.maxSeatsPerSession ?? 1,
        allowedSeatType: item.allowedSeatType || "normale",
        expirationDate: item.expirationDate,
        description: item.description ?? "",
        isActive: nextIsActive,
      });

      if (!result.ok) {
        showToast(result.message || "Mise à jour impossible.", "error");
        return;
      }

      showToast("Statut mis à jour.", "success");
      router.refresh();
    } catch {
      showToast("Mise à jour impossible.", "error");
    } finally {
      setStatusUpdatingId("");
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-secondary text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
              Abonnements
            </h1>
            <p className="text-slate-500 mt-1">
              Gérez les formules d&apos;abonnement et leurs crédits.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {permissions.canCreate ? (
              <button
                type="button"
                onClick={openCreateModal}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary/90"
              >
                <Icon name="plus" className="h-5 w-5" />
                Ajouter un abonnement
              </button>
            ) : null}
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
                Liste des abonnements
              </h2>
              <p className="text-sm text-slate-500">
                {sortedSubscriptions.length} abonnements disponibles
              </p>
            </div>
          </div>

          {sortedSubscriptions.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              Aucun abonnement pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Nom</th>
                    <th className="px-6 py-4">Prix</th>
                    <th className="px-6 py-4">Crédits</th>
                    <th className="px-6 py-4">Sièges/séance</th>
                    <th className="px-6 py-4">Type de siège</th>
                    <th className="px-6 py-4">Expiration</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  {sortedSubscriptions.map((item) => {
                    const isActive = item.isActive !== false;
                    const statusLabel = isActive
                      ? STATUS_LABELS.active
                      : STATUS_LABELS.inactive;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4">
                          {Number.isFinite(item.price)
                            ? formatPrice(item.price)
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          {Number.isFinite(item.totalCredits)
                            ? item.totalCredits
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          {Number.isFinite(item.maxSeatsPerSession)
                            ? item.maxSeatsPerSession
                            : "1"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.allowedSeatType === "tarif_fixe"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {item.allowedSeatType === "tarif_fixe" ? "VIP / Tarif fixe" : "Normal"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {item.expirationDate
                            ? formatDate(item.expirationDate)
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold ${
                                isActive ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              {statusLabel}
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isActive}
                              onClick={() => handleToggleStatus(item)}
                              disabled={!permissions.canUpdate || statusUpdatingId === item.id}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                                isActive ? "bg-emerald-500" : "bg-slate-300"
                              } ${
                                !permissions.canUpdate || statusUpdatingId === item.id
                                  ? "cursor-not-allowed opacity-70"
                                  : "hover:opacity-90"
                              }`}
                              aria-label="Basculer le statut"
                            >
                              <span
                                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
                                  isActive ? "translate-x-5" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            {permissions.canUpdate ? (
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary transition hover:bg-primary/10"
                                aria-label="Modifier"
                              >
                                <Icon name="pen" className="h-4 w-4" />
                              </button>
                            ) : null}
                            {permissions.canDelete ? (
                              <button
                                type="button"
                                onClick={() => setPendingDelete(item)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                                aria-label="Supprimer"
                              >
                                <Icon name="trash" className="h-4 w-4" />
                              </button>
                            ) : null}
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

        {isCreateOpen && permissions.canCreate ? (
          <Modal
            title="Ajouter un abonnement"
            description="Crée une nouvelle formule d'abonnement."
            onClose={() => (isSaving ? null : closeModals())}
            maxWidth="max-w-xl"
          >
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Nom
                </label>
                <input
                  name="name"
                  type="text"
                  value={formState.name}
                  onChange={handleInputChange}
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Prix
                  </label>
                  <input
                    name="price"
                    type="text"
                    value={formState.price}
                    onChange={handleInputChange}
                    className={INPUT_CLASSES}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Crédits totaux
                  </label>
                  <input
                    name="totalCredits"
                    type="text"
                    value={formState.totalCredits}
                    onChange={handleInputChange}
                    className={INPUT_CLASSES}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Limite de sièges par séance
                  </label>
                  <input
                    name="maxSeatsPerSession"
                    type="number"
                    min="1"
                    step="1"
                    value={formState.maxSeatsPerSession}
                    onChange={handleInputChange}
                    className={INPUT_CLASSES}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Type de siège autorisé
                  </label>
                  <select
                    name="allowedSeatType"
                    value={formState.allowedSeatType}
                    onChange={handleInputChange}
                    className={INPUT_CLASSES}
                  >
                    {ALLOWED_SEAT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Date d&apos;expiration
                </label>
                <input
                  name="expirationDate"
                  type="date"
                  value={formState.expirationDate}
                  onChange={handleInputChange}
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formState.description}
                  onChange={handleInputChange}
                  className={`${INPUT_CLASSES} min-h-[96px]`}
                />
              </div>

              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  name="isActive"
                  type="checkbox"
                  checked={formState.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40"
                />
                Actif
              </label>

              {formError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModals}
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

        {isEditOpen && permissions.canUpdate ? (
          <Modal
            title="Modifier l'abonnement"
            description="Mettez à jour la formule d'abonnement."
            onClose={() => (isSaving ? null : closeModals())}
            maxWidth="max-w-xl"
          >
            <form className="space-y-4" onSubmit={handleUpdate}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Nom
                </label>
                <input
                  name="name"
                  type="text"
                  value={formState.name}
                  onChange={handleInputChange}
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Prix
                  </label>
                  <input
                    name="price"
                    type="text"
                    value={formState.price}
                    onChange={handleInputChange}
                    className={INPUT_CLASSES}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Crédits totaux
                  </label>
                  <input
                    name="totalCredits"
                    type="text"
                    value={formState.totalCredits}
                    onChange={handleInputChange}
                    className={INPUT_CLASSES}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Limite de sièges par séance
                  </label>
                  <input
                    name="maxSeatsPerSession"
                    type="number"
                    min="1"
                    step="1"
                    value={formState.maxSeatsPerSession}
                    onChange={handleInputChange}
                    className={INPUT_CLASSES}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Type de siège autorisé
                  </label>
                  <select
                    name="allowedSeatType"
                    value={formState.allowedSeatType}
                    onChange={handleInputChange}
                    className={INPUT_CLASSES}
                  >
                    {ALLOWED_SEAT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Date d&apos;expiration
                </label>
                <input
                  name="expirationDate"
                  type="date"
                  value={formState.expirationDate}
                  onChange={handleInputChange}
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formState.description}
                  onChange={handleInputChange}
                  className={`${INPUT_CLASSES} min-h-[96px]`}
                />
              </div>

              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  name="isActive"
                  type="checkbox"
                  checked={formState.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40"
                />
                Actif
              </label>

              {formError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModals}
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

        {pendingDelete && permissions.canDelete ? (
          <ConfirmModal
            title="Supprimer l'abonnement"
            description={`Confirmer la suppression de "${
              pendingDelete.name || "cet abonnement"
            }" ?`}
            isLoading={isDeleting}
            onCancel={() => (isDeleting ? null : setPendingDelete(null))}
            onConfirm={handleDelete}
          />
        ) : null}
      </div>
      <Toast toast={toast} />
    </>
  );
}
