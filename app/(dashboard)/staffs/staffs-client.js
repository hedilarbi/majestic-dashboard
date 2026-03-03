"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/ui/icons";
import Modal from "@/components/ui/modal";
import ConfirmModal from "@/components/ui/confirm-modal";
import Toast from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import {
  createStaff,
  deleteStaff,
  toggleStaffStatus,
  updateStaff,
} from "@/services/staffs-actions";

const INPUT_CLASSES =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrateur" },
  { value: "ticket_office", label: "Billetterie" },
  { value: "door_staff", label: "Contrôle" },
];

const ROLE_STYLES = {
  admin: "bg-indigo-100 text-indigo-700",
  ticket_office: "bg-amber-100 text-amber-700",
  door_staff: "bg-cyan-100 text-cyan-700",
  fallback: "bg-slate-100 text-slate-600",
};

const STATUS_LABELS = {
  active: "Actif",
  suspended: "Suspendu",
};

const createEmptyForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "ticket_office",
  password: "",
  confirmPassword: "",
});

export default function StaffsClient({
  initialStaffs = [],
  initialError = "",
}) {
  const router = useRouter();
  const { toast, showToast } = useToast();
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
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showCreateConfirmPassword, setShowCreateConfirmPassword] =
    useState(false);

  useEffect(() => {
    setErrorMessage(initialError || "");
  }, [initialError]);

  const sortedStaffs = useMemo(() => {
    return [...initialStaffs].sort((a, b) => {
      const lastA = String(a.lastName || "");
      const lastB = String(b.lastName || "");
      const compareLast = lastA.localeCompare(lastB);
      if (compareLast !== 0) {
        return compareLast;
      }
      return String(a.firstName || "").localeCompare(String(b.firstName || ""));
    });
  }, [initialStaffs]);

  const availableRoleOptions = useMemo(() => {
    if (!editingItem?.role) {
      return ROLE_OPTIONS;
    }

    if (ROLE_OPTIONS.some((role) => role.value === editingItem.role)) {
      return ROLE_OPTIONS;
    }

    return [
      ...ROLE_OPTIONS,
      { value: editingItem.role, label: editingItem.role },
    ];
  }, [editingItem]);

  const openCreateModal = () => {
    setFormState(createEmptyForm());
    setFormError("");
    setEditingItem(null);
    setShowCreatePassword(false);
    setShowCreateConfirmPassword(false);
    setIsCreateOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormState({
      firstName: item.firstName || "",
      lastName: item.lastName || "",
      email: item.email || "",
      phone: item.phone || "",
      role: item.role || "ticket_office",
      password: "",
      confirmPassword: "",
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
    setShowCreatePassword(false);
    setShowCreateConfirmPassword(false);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const buildPayload = ({ requirePassword = false } = {}) => {
    const email = formState.email.trim();
    const firstName = formState.firstName.trim();
    const lastName = formState.lastName.trim();
    const phone = formState.phone.trim();
    const role = formState.role;
    const password = formState.password.trim();
    const confirmPassword = formState.confirmPassword.trim();

    if (!email || !email.includes("@")) {
      return { ok: false, message: "Veuillez saisir un email valide." };
    }

    if (!firstName || !lastName) {
      return { ok: false, message: "Veuillez saisir un prénom et un nom." };
    }

    if (!role) {
      return { ok: false, message: "Veuillez sélectionner un rôle." };
    }

    if (requirePassword && !password) {
      return { ok: false, message: "Veuillez saisir un mot de passe." };
    }

    if (requirePassword && !confirmPassword) {
      return { ok: false, message: "Veuillez confirmer le mot de passe." };
    }

    if (requirePassword && password !== confirmPassword) {
      return {
        ok: false,
        message: "Les mots de passe ne correspondent pas.",
      };
    }

    return {
      ok: true,
      payload: {
        email,
        firstName,
        lastName,
        phone: phone || undefined,
        role,
        password: password || undefined,
      },
    };
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const result = buildPayload({ requirePassword: true });

    if (!result.ok) {
      setFormError(result.message || "Création impossible.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await createStaff(result.payload);

      if (!response.ok) {
        const message = response.message || "Création impossible.";
        setFormError(message);
        showToast(message, "error");
        return;
      }

      closeModals();
      showToast("Staff créé avec succès.", "success");
      router.refresh();
    } catch (e) {
      console.log(console.error(e));
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
      const response = await updateStaff({
        id: editingItem.id,
        ...result.payload,
      });

      if (!response.ok) {
        setFormError(response.message || "Modification impossible.");
        return;
      }

      closeModals();
      showToast("Staff modifié avec succès.", "success");
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
      const result = await deleteStaff(pendingDelete.id);

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

    const currentStatus = item.status === "suspended" ? "suspended" : "active";
    const nextStatus = currentStatus === "active" ? "suspended" : "active";

    setStatusUpdatingId(item.id);

    try {
      const result = await toggleStaffStatus({
        id: item.id,
        status: nextStatus,
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
              Staffs
            </h1>
            <p className="text-slate-500 mt-1">
              Gérez les membres du personnel et leurs accès.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary/90"
            >
              <Icon name="plus" className="h-5 w-5" />
              Ajouter un staff
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
                Liste du staff
              </h2>
              <p className="text-sm text-slate-500">
                {sortedStaffs.length} membres
              </p>
            </div>
          </div>

          {sortedStaffs.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              Aucun membre pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Nom</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Téléphone</th>
                    <th className="px-6 py-4">Rôle</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  {sortedStaffs.map((item) => {
                    const fullName = [item.firstName, item.lastName]
                      .filter(Boolean)
                      .join(" ");
                    const roleLabel =
                      ROLE_OPTIONS.find((role) => role.value === item.role)
                        ?.label ||
                      item.role ||
                      "-";
                    const roleStyle =
                      ROLE_STYLES[item.role] || ROLE_STYLES.fallback;
                    const statusValue =
                      item.status === "suspended" ? "suspended" : "active";
                    const statusLabel = STATUS_LABELS[statusValue];
                    const isActive = statusValue === "active";

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {fullName || "-"}
                        </td>
                        <td className="px-6 py-4">{item.email || "-"}</td>
                        <td className="px-6 py-4">{item.phone || "-"}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${roleStyle}`}
                          >
                            {roleLabel}
                          </span>
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
                              disabled={statusUpdatingId === item.id}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                                isActive ? "bg-emerald-500" : "bg-slate-300"
                              } ${
                                statusUpdatingId === item.id
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isCreateOpen ? (
          <Modal
            title="Ajouter un staff"
            description="Crée un nouveau membre du personnel."
            onClose={() => (isSaving ? null : closeModals())}
            maxWidth="max-w-xl"
          >
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Prénom
                  </label>
                  <input
                    name="firstName"
                    type="text"
                    value={formState.firstName}
                    onChange={handleInputChange}
                    className={INPUT_CLASSES}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Nom
                  </label>
                  <input
                    name="lastName"
                    type="text"
                    value={formState.lastName}
                    onChange={handleInputChange}
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={formState.email}
                  onChange={handleInputChange}
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Téléphone
                </label>
                <input
                  name="phone"
                  type="tel"
                  value={formState.phone}
                  onChange={handleInputChange}
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Rôle
                </label>
                <div className="relative">
                  <select
                    name="role"
                    value={formState.role}
                    onChange={handleInputChange}
                    className={`${INPUT_CLASSES} appearance-none`}
                  >
                    {availableRoleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <Icon name="chevronDown" className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showCreatePassword ? "text" : "password"}
                    value={formState.password}
                    onChange={handleInputChange}
                    className={`${INPUT_CLASSES} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-600"
                    aria-label={
                      showCreatePassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    <Icon
                      name={showCreatePassword ? "eyeOff" : "eye"}
                      className="h-4 w-4"
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showCreateConfirmPassword ? "text" : "password"}
                    value={formState.confirmPassword}
                    onChange={handleInputChange}
                    className={`${INPUT_CLASSES} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowCreateConfirmPassword((current) => !current)
                    }
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-600"
                    aria-label={
                      showCreateConfirmPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    <Icon
                      name={showCreateConfirmPassword ? "eyeOff" : "eye"}
                      className="h-4 w-4"
                    />
                  </button>
                </div>
              </div>

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

        {isEditOpen ? (
          <Modal
            title="Modifier le staff"
            description="Mettez à jour les informations du membre."
            onClose={() => (isSaving ? null : closeModals())}
            maxWidth="max-w-xl"
          >
            <form className="space-y-4" onSubmit={handleUpdate}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Prénom
                  </label>
                  <input
                    name="firstName"
                    type="text"
                    value={formState.firstName}
                    onChange={handleInputChange}
                    className={INPUT_CLASSES}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Nom
                  </label>
                  <input
                    name="lastName"
                    type="text"
                    value={formState.lastName}
                    onChange={handleInputChange}
                    className={INPUT_CLASSES}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={formState.email}
                  onChange={handleInputChange}
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Téléphone
                </label>
                <input
                  name="phone"
                  type="tel"
                  value={formState.phone}
                  onChange={handleInputChange}
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Rôle
                </label>
                <div className="relative">
                  <select
                    name="role"
                    value={formState.role}
                    onChange={handleInputChange}
                    className={`${INPUT_CLASSES} appearance-none`}
                  >
                    {availableRoleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <Icon name="chevronDown" className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Nouveau mot de passe
                </label>
                <input
                  name="password"
                  type="password"
                  value={formState.password}
                  onChange={handleInputChange}
                  className={INPUT_CLASSES}
                  placeholder="Laisser vide pour ne pas changer"
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

        {pendingDelete ? (
          <ConfirmModal
            title="Supprimer le staff"
            description={`Confirmer la suppression de "${
              pendingDelete.firstName || pendingDelete.email || "ce membre"
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
