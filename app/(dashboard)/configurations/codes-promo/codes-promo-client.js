"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/ui/icons";
import Modal from "@/components/ui/modal";
import Toast from "@/components/ui/toast";
import { useDashboardModulePermissions } from "@/hooks/use-dashboard-permissions";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/configurations/formatters";
import { formatDate, toDateInputValue } from "@/lib/evenements/helpers";
import {
  createPromoCode,
  deletePromoCode,
  generatePromoCode,
  updatePromoCode,
  updatePromoCodeStatus,
} from "@/services/promo-codes-actions";

const INPUT_CLASSES =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

const REDUCTION_TYPE_OPTIONS = [
  { value: "amount", label: "Montant (DT)" },
  { value: "percent", label: "Pourcentage (%)" },
];

const AVAILABILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Prive" },
];
const PROMO_CODE_PATTERN = /^[A-Z]{3}\d{3}$/;

const createEmptyForm = () => ({
  code: "",
  reductionValue: "",
  reductionType: "amount",
  availability: "public",
  expiresAt: "",
  totalUsageLimit: "",
  userUsageLimit: "",
  isActive: true,
});

const buildFallbackPromoCode = (existingItems = []) => {
  const existingCodes = new Set(
    (Array.isArray(existingItems) ? existingItems : [])
      .map((item) => String(item?.code || "").trim().toUpperCase())
      .filter(Boolean),
  );

  let attempts = 0;
  while (attempts < 100) {
    const letters = Array.from({ length: 3 }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26)),
    ).join("");
    const digits = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const candidate = `${letters}${digits}`;

    if (!existingCodes.has(candidate)) {
      return candidate;
    }

    attempts += 1;
  }

  return "ABC123";
};

export default function CodesPromoClient({
  initialPromoCodes = [],
  initialError = "",
}) {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const permissions = useDashboardModulePermissions("promo_codes");
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState("");
  const [formState, setFormState] = useState(createEmptyForm);
  const [formError, setFormError] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    setErrorMessage(initialError || "");
  }, [initialError]);

  const sortedPromoCodes = useMemo(() => {
    return [...initialPromoCodes].sort((a, b) =>
      String(a.code || "").localeCompare(String(b.code || "")),
    );
  }, [initialPromoCodes]);

  const formatUsageLimit = (value) => {
    if (value === null || value === undefined || value === "") {
      return "∞";
    }

    const parsed = typeof value === "number" ? value : Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : "-";
  };

  const openCreateModal = async () => {
    const fallbackCode = buildFallbackPromoCode(initialPromoCodes);

    setFormState({
      ...createEmptyForm(),
      code: fallbackCode,
    });
    setFormError("");
    setEditingItem(null);
    setIsCreateOpen(true);

    setIsGeneratingCode(true);
    try {
      const result = await generatePromoCode();
      if (!result?.ok || !result.code) {
        return;
      }

      setFormState((current) =>
        current.code === fallbackCode ? { ...current, code: result.code } : current,
      );
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormState({
      code: item.code || "",
      reductionValue: Number.isFinite(item.reductionValue)
        ? String(item.reductionValue)
        : (item.reductionValue ?? ""),
      reductionType: item.reductionType || "amount",
      availability: item.availability || "public",
      expiresAt: toDateInputValue(item.expiresAt),
      totalUsageLimit: Number.isFinite(item.totalUsageLimit)
        ? String(item.totalUsageLimit)
        : (item.totalUsageLimit ?? ""),
      userUsageLimit: Number.isFinite(item.userUsageLimit)
        ? String(item.userUsageLimit)
        : (item.userUsageLimit ?? ""),
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
      [name]:
        type === "checkbox"
          ? checked
          : name === "code"
            ? value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
            : value,
    }));
  };

  const normalizeNumberInput = (value) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : undefined;
    }

    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number.parseFloat(trimmed.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
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
    const code = formState.code.trim().toUpperCase();
    const reductionValue = normalizeNumberInput(formState.reductionValue);
    const totalUsageLimit = normalizeNumberInput(formState.totalUsageLimit);
    const userUsageLimit = normalizeNumberInput(formState.userUsageLimit);
    const expiresAt = normalizeDateInput(formState.expiresAt);

    if (!code) {
      return { ok: false, message: "Veuillez saisir un code." };
    }

    if (!PROMO_CODE_PATTERN.test(code)) {
      return {
        ok: false,
        message:
          "Le code doit contenir 3 lettres majuscules suivies de 3 chiffres.",
      };
    }

    if (reductionValue === null || reductionValue === undefined) {
      return { ok: false, message: "Veuillez saisir une valeur valide." };
    }

    if (
      !REDUCTION_TYPE_OPTIONS.some(
        (option) => option.value === formState.reductionType,
      )
    ) {
      return { ok: false, message: "Veuillez choisir un type de réduction." };
    }

    if (!expiresAt) {
      return {
        ok: false,
        message: "Veuillez saisir une date d'expiration valide.",
      };
    }

    if (totalUsageLimit === undefined) {
      return {
        ok: false,
        message: "Veuillez saisir une limite totale valide.",
      };
    }

    if (userUsageLimit === undefined) {
      return {
        ok: false,
        message: "Veuillez saisir une limite utilisateur valide.",
      };
    }

    return {
      ok: true,
      payload: {
        code,
        reductionValue,
        reductionType: formState.reductionType,
        availability: formState.availability,
        expiresAt,
        totalUsageLimit,
        userUsageLimit,
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
      const response = await createPromoCode(result.payload);

      if (!response.ok) {
        const message = response.message || "Création impossible.";
        setFormError(message);
        showToast(message, "error");
        return;
      }

      closeModals();
      showToast("Code promo créé avec succès.", "success");
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
      const response = await updatePromoCode({
        id: editingItem.id,
        ...result.payload,
      });

      if (!response.ok) {
        setFormError(response.message || "Modification impossible.");
        return;
      }

      closeModals();
      showToast("Code promo modifié avec succès.", "success");
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
      const response = await deletePromoCode(pendingDelete.id);

      if (!response.ok) {
        setErrorMessage(response.message || "Suppression impossible.");
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
      const result = await updatePromoCodeStatus({
        id: item.id,
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
              Codes promo
            </h1>
            <p className="text-slate-500 mt-1">
              Gère les codes promotionnels et leurs restrictions.
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
                Ajouter un code
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
                Liste des codes promo
              </h2>
              <p className="text-sm text-slate-500">
                {sortedPromoCodes.length} codes disponibles
              </p>
            </div>
          </div>

          {sortedPromoCodes.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              Aucun code promo pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Disponibilite</th>
                    <th className="px-6 py-4">Réduction</th>
                    <th className="px-6 py-4">Expiration</th>
                    <th className="px-6 py-4">Limites</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  {sortedPromoCodes.map((item) => {
                    const isActive = item.isActive !== false;
                    const numericReduction =
                      typeof item.reductionValue === "number"
                        ? item.reductionValue
                        : Number.parseFloat(item.reductionValue);
                    const reductionLabel =
                      item.reductionType === "percent"
                        ? Number.isFinite(numericReduction)
                          ? `${numericReduction}%`
                          : "-"
                        : formatPrice(item.reductionValue);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {item.code}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              item.availability === "private"
                                ? "border-slate-300 bg-slate-100 text-slate-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {item.availability === "private" ? "Prive" : "Public"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-900">
                          {reductionLabel}
                        </td>
                        <td className="px-6 py-4">
                          {item.expiresAt ? formatDate(item.expiresAt) : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-900 font-medium">
                            {formatUsageLimit(item.totalUsageLimit)}
                            {" / "}
                            {formatUsageLimit(item.userUsageLimit)}
                          </div>
                          <span className="text-xs text-slate-500">
                            total / utilisateur
                          </span>
                        </td>
                        <td className="px-6 py-4">
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
            title="Ajouter un code promo"
            description="Renseigne les détails du code promotionnel."
            onClose={() => (isSaving ? null : closeModals())}
            maxWidth="max-w-2xl"
          >
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Code
                  </label>
                  <input
                    name="code"
                    type="text"
                    value={formState.code}
                    onChange={handleInputChange}
                    placeholder="ABC123"
                    className={INPUT_CLASSES}
                  />
                  {isGeneratingCode ? (
                    <p className="text-xs text-slate-500">
                      Generation d&apos;un code unique...
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Type de réduction
                  </label>
                  <select
                    name="reductionType"
                    value={formState.reductionType}
                    onChange={handleInputChange}
                    className={INPUT_CLASSES}
                  >
                    {REDUCTION_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Disponibilite
                  </label>
                  <select
                    name="availability"
                    value={formState.availability}
                    onChange={handleInputChange}
                    className={INPUT_CLASSES}
                  >
                    {AVAILABILITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Valeur
                  </label>
                  <input
                    name="reductionValue"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.reductionValue}
                    onChange={handleInputChange}
                    placeholder="10"
                    className={INPUT_CLASSES}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Expiration
                  </label>
                  <input
                    name="expiresAt"
                    type="date"
                    value={formState.expiresAt}
                    onChange={handleInputChange}
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Limite totale
                  </label>
                  <input
                    name="totalUsageLimit"
                    type="number"
                    min="0"
                    step="1"
                    value={formState.totalUsageLimit}
                    onChange={handleInputChange}
                    placeholder="100"
                    className={INPUT_CLASSES}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Limite par utilisateur
                  </label>
                  <input
                    name="userUsageLimit"
                    type="number"
                    min="0"
                    step="1"
                    value={formState.userUsageLimit}
                    onChange={handleInputChange}
                    placeholder="1"
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Laissez vide pour illimité.
              </p>

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
            title="Modifier le code promo"
            description="Mets à jour les informations du code promo."
            onClose={() => (isSaving ? null : closeModals())}
            maxWidth="max-w-2xl"
          >
            <form className="space-y-4" onSubmit={handleUpdate}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Code
                  </label>
                  <input
                    name="code"
                    type="text"
                    value={formState.code}
                    onChange={handleInputChange}
                    placeholder="ABC123"
                    className={INPUT_CLASSES}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Type de réduction
                  </label>
                  <select
                    name="reductionType"
                    value={formState.reductionType}
                    onChange={handleInputChange}
                    className={INPUT_CLASSES}
                  >
                    {REDUCTION_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Disponibilite
                  </label>
                  <select
                    name="availability"
                    value={formState.availability}
                    onChange={handleInputChange}
                    className={INPUT_CLASSES}
                  >
                    {AVAILABILITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Valeur
                  </label>
                  <input
                    name="reductionValue"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.reductionValue}
                    onChange={handleInputChange}
                    placeholder="10"
                    className={INPUT_CLASSES}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Expiration
                  </label>
                  <input
                    name="expiresAt"
                    type="date"
                    value={formState.expiresAt}
                    onChange={handleInputChange}
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Limite totale
                  </label>
                  <input
                    name="totalUsageLimit"
                    type="number"
                    min="0"
                    step="1"
                    value={formState.totalUsageLimit}
                    onChange={handleInputChange}
                    placeholder="100"
                    className={INPUT_CLASSES}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Limite par utilisateur
                  </label>
                  <input
                    name="userUsageLimit"
                    type="number"
                    min="0"
                    step="1"
                    value={formState.userUsageLimit}
                    onChange={handleInputChange}
                    placeholder="1"
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Laissez vide pour illimité.
              </p>

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
          <Modal
            title="Supprimer le code promo"
            description={`Confirmer la suppression de "${pendingDelete.code}" ?`}
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
