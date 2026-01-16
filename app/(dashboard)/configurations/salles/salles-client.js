"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/ui/icons";
import Modal from "@/components/ui/modal";
import ConfirmModal from "@/components/ui/confirm-modal";
import Toast from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/configurations/formatters";
import {
  buildRoomPayload,
  buildRoomStateFromRoom,
  buildRowLabels,
  countSeats,
  createLayoutMap,
  getCellKey,
} from "@/lib/configurations/rooms";
import RoomLayoutEditor from "@/components/configurations/room-layout-editor";
import { createRoom, deleteRoom, updateRoom } from "@/services/rooms-actions";

const INPUT_CLASSES =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

const TEXT = {
  title: "Salles",
  subtitle: "Gérez les salles et leurs plans.",

  add: "Ajouter une salle",
  listTitle: "Liste des salles",
  listSubtitle: "salles configurées",
  empty: "Aucune salle pour le moment.",
  room: "Salle",
  capacity: "Capacité",
  actions: "Actions",
  createTitle: "Nouvelle salle",
  editTitle: "Modifier la salle",
  nameLabel: "Nom de la salle",
  rowsLabel: "Nombre de lignes",
  colsLabel: "Nombre de colonnes",
  generate: "Générer le plan",
  seatsLabel: "Capacité calculée",
  cancel: "Annuler",
  create: "Créer",
  save: "Enregistrer",
  deleteTitle: "Supprimer la salle",
  deleteConfirm: "Confirmer la suppression de la salle",
};

const buildPricingOptions = (pricingList) =>
  pricingList
    .filter((item) => item.id && item.name)
    .map((item) => ({
      id: item.id,
      label: `${item.name} (${formatPrice(item.price)})`,
    }));

const createEmptyState = () => ({
  rows: [],
  columns: 0,
  layoutMap: {},
  staffMap: {},
  pricingMap: {},
});

export default function SallesClient({
  initialRooms = [],
  initialPricing = [],
  roomsError = "",
  pricingError = "",
}) {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [errorMessage, setErrorMessage] = useState(roomsError);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formName, setFormName] = useState("");
  const [rowCount, setRowCount] = useState("");
  const [columnCount, setColumnCount] = useState("");
  const [layoutState, setLayoutState] = useState(createEmptyState);
  const [selectedCell, setSelectedCell] = useState(null);
  const [formError, setFormError] = useState("");
  const [editingRoom, setEditingRoom] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    setErrorMessage(roomsError || "");
  }, [roomsError]);

  const sortedRooms = useMemo(
    () => [...initialRooms].sort((a, b) => a.name.localeCompare(b.name)),
    [initialRooms]
  );

  const pricingOptions = useMemo(
    () => buildPricingOptions(initialPricing),
    [initialPricing]
  );

  const seatCount = useMemo(() => countSeats(layoutState), [layoutState]);

  const resetForm = () => {
    setFormName("");
    setRowCount("");
    setColumnCount("");
    setLayoutState(createEmptyState());
    setSelectedCell(null);
    setFormError("");
    setEditingRoom(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditModal = (room) => {
    const state = buildRoomStateFromRoom(room);

    setEditingRoom(room);
    setFormName(room.name || "");
    setRowCount(state.rows.length ? String(state.rows.length) : "");
    setColumnCount(state.columns ? String(state.columns) : "");
    setLayoutState(state);
    setSelectedCell(null);
    setFormError("");
    setIsEditOpen(true);
  };

  const closeModals = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    resetForm();
  };

  const handleGenerateLayout = () => {
    const rows = buildRowLabels(rowCount);
    const columns = Number.parseInt(columnCount, 10);

    if (!rows.length || !Number.isFinite(columns) || columns <= 0) {
      setFormError("Veuillez saisir des dimensions valides.");
      return;
    }

    const layoutMap = createLayoutMap(rows, columns);
    setLayoutState({
      rows,
      columns,
      layoutMap,
      staffMap: {},
      pricingMap: {},
    });
    setSelectedCell(null);
    setFormError("");
  };

  const handleSetCellType = (type, cellOverride = null) => {
    const activeCell = cellOverride || selectedCell;

    if (!activeCell) {
      return;
    }

    const key = getCellKey(activeCell.row, activeCell.col);

    setLayoutState((prev) => {
      const nextLayoutMap = { ...prev.layoutMap };
      const nextStaffMap = { ...prev.staffMap };
      const nextPricingMap = { ...prev.pricingMap };

      if (type === "couloir") {
        nextLayoutMap[key] = "couloir";
        delete nextStaffMap[key];
        delete nextPricingMap[key];
      } else if (type === "staff") {
        nextLayoutMap[key] = "chaise";
        nextStaffMap[key] = true;
        delete nextPricingMap[key];
      } else if (type === "pricing") {
        nextLayoutMap[key] = "chaise";
        delete nextStaffMap[key];
        const fallback = pricingOptions[0]?.id || "";
        if (fallback) {
          nextPricingMap[key] = nextPricingMap[key] || fallback;
        }
      } else {
        nextLayoutMap[key] = "chaise";
        delete nextStaffMap[key];
        delete nextPricingMap[key];
      }

      return {
        ...prev,
        layoutMap: nextLayoutMap,
        staffMap: nextStaffMap,
        pricingMap: nextPricingMap,
      };
    });
  };

  const handleSetPricingId = (pricingId, cellOverride = null) => {
    const activeCell = cellOverride || selectedCell;

    if (!activeCell) {
      return;
    }

    const key = getCellKey(activeCell.row, activeCell.col);

    setLayoutState((prev) => {
      const nextPricingMap = { ...prev.pricingMap };

      if (!pricingId) {
        delete nextPricingMap[key];
      } else {
        nextPricingMap[key] = pricingId;
      }

      return {
        ...prev,
        pricingMap: nextPricingMap,
      };
    });
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (!formName.trim()) {
      setFormError("Veuillez saisir un nom de salle.");
      return;
    }

    if (!layoutState.rows.length || !layoutState.columns) {
      setFormError("Veuillez générer un plan de salle.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = buildRoomPayload(layoutState);
      const result = await createRoom({
        name: formName,
        layout: payload.layout,
        overrides: payload.overrides,
        pricingOverrides: payload.pricingOverrides,
      });

      if (!result.ok) {
        const message = result.message || "Création impossible.";
        setFormError(message);
        showToast(message, "error");
        return;
      }

      closeModals();
      showToast("Salle créée avec succès.", "success");
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

    if (!editingRoom) {
      return;
    }

    if (!formName.trim()) {
      setFormError("Veuillez saisir un nom de salle.");
      return;
    }

    if (!layoutState.rows.length || !layoutState.columns) {
      setFormError("Plan de salle manquant.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = buildRoomPayload(layoutState);
      const result = await updateRoom({
        id: editingRoom.id,
        name: formName,
        layout: payload.layout,
        overrides: payload.overrides,
        pricingOverrides: payload.pricingOverrides,
      });

      if (!result.ok) {
        setFormError(result.message || "Modification impossible.");
        return;
      }

      closeModals();
      showToast("Salle modifiée avec succès.", "success");
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
      const result = await deleteRoom(pendingDelete.id);

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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-secondary text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
              {TEXT.title}
            </h1>
            <p className="text-slate-500 mt-1">{TEXT.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary/90"
            >
              <Icon name="plus" className="h-5 w-5" />
              {TEXT.add}
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
                {TEXT.listTitle}
              </h2>
              <p className="text-sm text-slate-500">
                {sortedRooms.length} {TEXT.listSubtitle}
              </p>
            </div>
          </div>

          {sortedRooms.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              {TEXT.empty}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4">{TEXT.room}</th>
                    <th className="px-6 py-4">{TEXT.capacity}</th>
                    <th className="px-6 py-4 text-right">{TEXT.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  {sortedRooms.map((room) => (
                    <tr
                      key={room.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {room.name}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {room.capacity ?? "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => openEditModal(room)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary transition hover:bg-primary/10"
                            aria-label="Modifier"
                          >
                            <Icon name="pen" className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(room)}
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
            title={TEXT.createTitle}
            description="Créez une nouvelle salle et configurez son plan."
            maxWidth="max-w-5xl"
            containerClassName="max-h-[95vh] overflow-hidden flex flex-col"
            bodyClassName="flex-1 overflow-y-auto pr-1"
            onClose={() => (isSaving ? null : closeModals())}
          >
            <form className="space-y-5" onSubmit={handleCreate}>
              {pricingError ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {pricingError}
                </div>
              ) : null}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {TEXT.nameLabel}
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(event) => setFormName(event.target.value)}
                    className={INPUT_CLASSES}
                    placeholder="Salle 1"
                  />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    {TEXT.seatsLabel}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {seatCount}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {TEXT.rowsLabel}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={rowCount}
                    onChange={(event) => setRowCount(event.target.value)}
                    className={INPUT_CLASSES}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {TEXT.colsLabel}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={columnCount}
                    onChange={(event) => setColumnCount(event.target.value)}
                    className={INPUT_CLASSES}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleGenerateLayout}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {TEXT.generate}
                  </button>
                </div>
              </div>

              <RoomLayoutEditor
                rows={layoutState.rows}
                columns={layoutState.columns}
                layoutMap={layoutState.layoutMap}
                staffMap={layoutState.staffMap}
                pricingMap={layoutState.pricingMap}
                pricingOptions={pricingOptions}
                selectedCell={selectedCell}
                onSelectCell={setSelectedCell}
                onSetCellType={handleSetCellType}
                onSetPricingId={handleSetPricingId}
              />

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
                  {TEXT.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary/90 disabled:opacity-70"
                >
                  {isSaving ? "Création..." : TEXT.create}
                </button>
              </div>
            </form>
          </Modal>
        ) : null}

        {isEditOpen ? (
          <Modal
            title={TEXT.editTitle}
            description="Modifiez le plan de la salle et les options des sièges."
            maxWidth="max-w-5xl"
            containerClassName="max-h-[95vh] overflow-hidden flex flex-col"
            bodyClassName="flex-1 overflow-y-auto pr-1"
            onClose={() => (isSaving ? null : closeModals())}
          >
            <form className="space-y-5" onSubmit={handleUpdate}>
              {pricingError ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {pricingError}
                </div>
              ) : null}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {TEXT.nameLabel}
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(event) => setFormName(event.target.value)}
                    className={INPUT_CLASSES}
                  />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    {TEXT.seatsLabel}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {seatCount}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {TEXT.rowsLabel}
                  </label>
                  <input
                    type="number"
                    value={rowCount}
                    disabled
                    className={`${INPUT_CLASSES} bg-slate-50 text-slate-400`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {TEXT.colsLabel}
                  </label>
                  <input
                    type="number"
                    value={columnCount}
                    disabled
                    className={`${INPUT_CLASSES} bg-slate-50 text-slate-400`}
                  />
                </div>
              </div>

              <RoomLayoutEditor
                rows={layoutState.rows}
                columns={layoutState.columns}
                layoutMap={layoutState.layoutMap}
                staffMap={layoutState.staffMap}
                pricingMap={layoutState.pricingMap}
                pricingOptions={pricingOptions}
                selectedCell={selectedCell}
                onSelectCell={setSelectedCell}
                onSetCellType={handleSetCellType}
                onSetPricingId={handleSetPricingId}
              />

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
                  {TEXT.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary/90 disabled:opacity-70"
                >
                  {isSaving ? "Enregistrement..." : TEXT.save}
                </button>
              </div>
            </form>
          </Modal>
        ) : null}

        {pendingDelete ? (
          <ConfirmModal
            title={TEXT.deleteTitle}
            description={`${TEXT.deleteConfirm} ${pendingDelete.name} ?`}
            confirmLabel="Supprimer"
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
