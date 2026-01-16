"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/ui/icons";
import ConfirmModal from "@/components/ui/confirm-modal";
import SessionFormModal from "@/components/evenements/session-form-modal";
import { useToast } from "@/hooks/use-toast";
import Toast from "@/components/ui/toast";
import { formatDate } from "@/lib/evenements/helpers";
import { deleteSession, updateSession } from "@/services/sessions-actions";

const TEXT = {
  empty: "Aucune séance trouvée.",
  confirm: "Confirmer",
  confirmLoading: "Confirmation...",
  confirmSuccess: "Séance confirmée.",
  confirmError: "Confirmation impossible.",
  deleteTitle: "Supprimer la séance",
  deleteSuccess: "Séance supprimée.",
  deleteError: "Suppression impossible.",
};

const buildDeleteDescription = (session) => {
  if (!session) {
    return "";
  }

  const dateLabel = formatDate(session.date);
  const timeLabel = session.sessionTime || session.timeLabel || "";
  const versionLabel = session.version || session.format || "";
  const details = [dateLabel, timeLabel, versionLabel]
    .filter(Boolean)
    .join(" • ");

  return details
    ? `Confirmer la suppression de la séance ${details} ?`
    : "Confirmer la suppression de cette séance ?";
};

export default function SessionsTable({
  sessions = [],
  events = [],
  showEvent = false,
  eventId = "",
  event,
  rooms = [],
  showRoom = false,
  sessionTimes = [],
  pricing = [],
  roomsError = "",
  sessionTimesError = "",
  pricingError = "",
}) {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [editingSession, setEditingSession] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [confirmingId, setConfirmingId] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const eventLookup = useMemo(() => {
    const lookup = {};
    events.forEach((item) => {
      if (item?.id) {
        lookup[item.id] = item;
      }
    });
    return lookup;
  }, [events]);

  const roomLookup = useMemo(() => {
    const lookup = {};
    rooms.forEach((item) => {
      if (item?.id) {
        lookup[item.id] = item;
      }
    });
    return lookup;
  }, [rooms]);

  const columnCount = 5 + (showEvent ? 1 : 0) + (showRoom ? 1 : 0);

  const handleConfirm = async (session) => {
    if (!session?.id) {
      showToast(TEXT.confirmError, "error");
      return;
    }

    setConfirmingId(session.id);
    const targetEventId = eventId || session.eventId || event?.id;

    try {
      const result = await updateSession(
        session.id,
        { status: "in_progress" },
        targetEventId
      );

      if (!result.ok) {
        showToast(result.message || TEXT.confirmError, "error");
        return;
      }

      showToast(TEXT.confirmSuccess, "success");
      router.refresh();
    } catch {
      showToast(TEXT.confirmError, "error");
    } finally {
      setConfirmingId("");
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete?.id) {
      setPendingDelete(null);
      return;
    }

    setIsDeleting(true);
    const targetEventId = eventId || pendingDelete.eventId || event?.id || "";

    try {
      const result = await deleteSession(pendingDelete.id, targetEventId);

      if (!result.ok) {
        showToast(result.message || TEXT.deleteError, "error");
        return;
      }

      showToast(TEXT.deleteSuccess, "success");
      router.refresh();
      setPendingDelete(null);
    } catch {
      showToast(TEXT.deleteError, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {showEvent ? (
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Événement
                  </th>
                ) : null}
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Date et heure
                </th>
                {/* {showRoom ? (
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Salle
                  </th>
                ) : null} */}
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Format
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Occupation
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sessions.length === 0 ? (
                <tr>
                  <td
                    className="px-6 py-8 text-sm text-slate-500"
                    colSpan={columnCount}
                  >
                    {TEXT.empty}
                  </td>
                </tr>
              ) : (
                sessions.map((session) => {
                  const statusValue = String(
                    session.status || ""
                  ).toLowerCase();
                  const isPending = statusValue === "pending";
                  const isConfirming = confirmingId === session.id;
                  const eventId =
                    typeof session.eventId === "string" ? session.eventId : "";
                  const roomId =
                    typeof session.roomId === "string" ? session.roomId : "";
                  const eventInfo = eventId ? eventLookup[eventId] : null;
                  const eventName =
                    session.eventName ||
                    session.event?.name ||
                    eventInfo?.name ||
                    "";
                  const eventShortId = eventId
                    ? eventId.slice(-6).toUpperCase()
                    : "";
                  // const roomName =
                  //   roomLookup[roomId]?.name ||
                  //   session.roomName ||
                  //   "";
                  // const roomLabel =
                  //   roomName ||
                  //   (roomId
                  //     ? `#${roomId.slice(-6).toUpperCase()}`
                  //     : "");

                  return (
                    <tr
                      key={session.id}
                      className="group hover:bg-slate-50 transition-colors"
                    >
                      {showEvent ? (
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900">
                              {eventName || "-"}
                            </span>
                            {eventShortId ? (
                              <span className="text-xs text-slate-500">
                                ID: #{eventShortId}
                              </span>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">
                            {formatDate(session.date)}
                          </span>
                          <span className="text-sm text-slate-500">
                            {session.sessionTime || session.timeLabel}
                          </span>
                        </div>
                      </td>
                      {/* {showRoom ? (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {roomLabel || "-"}
                        </td>
                      ) : null} */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {session.version || session.format}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {session.occupancy !== null ? (
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-accent h-2 rounded-full"
                                style={{ width: `${session.occupancy}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500">
                              {session.occupancy}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-2 text-sm font-medium ${session.statusMeta.color}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${session.statusMeta.dot}`}
                          ></span>
                          {session.statusMeta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          {isPending ? (
                            <button
                              type="button"
                              onClick={() => handleConfirm(session)}
                              disabled={isConfirming}
                              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
                              aria-label="Confirmer la séance"
                            >
                              <Icon name="check" className="h-3.5 w-3.5" />
                              {isConfirming
                                ? TEXT.confirmLoading
                                : TEXT.confirm}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setEditingSession(session)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary transition hover:bg-primary/10"
                            aria-label="Modifier la séance"
                          >
                            <Icon name="pen" className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(session)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                            aria-label="Supprimer la séance"
                          >
                            <Icon name="trash" className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingSession ? (
        <SessionFormModal
          mode="edit"
          event={event || eventLookup[editingSession.eventId] || null}
          session={editingSession}
          rooms={rooms}
          sessionTimes={sessionTimes}
          pricing={pricing}
          roomsError={roomsError}
          sessionTimesError={sessionTimesError}
          pricingError={pricingError}
          onClose={() => setEditingSession(null)}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmModal
          title={TEXT.deleteTitle}
          description={buildDeleteDescription(pendingDelete)}
          confirmLabel="Supprimer"
          isLoading={isDeleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      ) : null}

      <Toast toast={toast} />
    </>
  );
}
