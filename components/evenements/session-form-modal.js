"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/ui/icons";
import {
  INPUT_CLASSES,
  VERSION_OPTIONS,
  toDateInputValue,
} from "@/lib/evenements/helpers";
import {
  buildRoomStateFromRoom,
  countSeats,
  getCellKey,
} from "@/lib/configurations/rooms";
import { useToast } from "@/hooks/use-toast";
import Toast from "@/components/ui/toast";
import { createSessions, updateSession } from "@/services/sessions-actions";
import SessionRoomEditor from "./session-room-editor";

const VERSION_LABELS = VERSION_OPTIONS.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const FALLBACK_VERSIONS = VERSION_OPTIONS.map((option) => option.value);

const TEXT = {
  titleCreate: "Nouvelle séance",
  titleEdit: "Modifier la séance",
  subtitleCreate: "Planifiez une séance pour cet événement.",
  subtitleEdit: "Mettez à jour les détails de la séance.",
  eventLabel: "Événement",
  eventPlaceholder: "Choisir un événement",
  eventSearchPlaceholder: "Rechercher un événement...",
  eventEmpty: "Aucun événement trouvé.",

  date: "Date",
  language: "Langue",
  sessionTime: "Horaires de séances",
  sessionTimeHintCreate: "Sélectionnez un ou plusieurs horaires.",
  sessionTimeHintEdit: "Sélectionnez un horaire.",
  room: "Salle",
  pricing: "Tarifs & quotas",
  noTimes: "Aucun horaire configuré.",
  noRooms: "Aucune salle disponible.",
  noPricing: "Aucun tarif configuré.",
  cancel: "Annuler",
  create: "Créer les séances",
  update: "Enregistrer",
};

const formatPrice = (value) => {
  const numeric = typeof value === "number" ? value : Number.parseFloat(value);

  if (!Number.isFinite(numeric)) {
    return "-";
  }

  return `${numeric.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} DT`;
};

const formatEventMeta = (event) => {
  const genres = Array.isArray(event?.genres) ? event.genres : [];
  const duration =
    typeof event?.duration === "number" ? `${event.duration} min` : "";

  const parts = [genres.join(", "), duration].filter(Boolean);

  return parts.length ? parts.join(" • ") : "";
};

const getTodayInputValue = () => {
  const today = new Date();
  const pad = (segment) => String(segment).padStart(2, "0");

  return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(
    today.getDate()
  )}`;
};

const buildPricingState = (pricing) => {
  if (!Array.isArray(pricing)) {
    return {};
  }

  return pricing.reduce((acc, item) => {
    if (!item?.id) {
      return acc;
    }

    acc[item.id] = { enabled: true, quota: "" };
    return acc;
  }, {});
};

const buildPricingStateFromSession = (pricing, session) => {
  const base = buildPricingState(pricing);
  const limits = Array.isArray(session?.pricingLimits)
    ? session.pricingLimits
    : [];

  limits.forEach((limit) => {
    const id = limit?.pricingId?._id ?? limit?.pricingId;
    if (!id || !base[id]) {
      return;
    }

    base[id] = {
      ...base[id],
      enabled: true,
      quota:
        limit?.maxTickets !== undefined && limit?.maxTickets !== null
          ? String(limit.maxTickets)
          : "",
    };
  });

  return base;
};

const applySessionOverrides = (baseState, session) => {
  if (!session) {
    return baseState;
  }

  const staffMap = { ...baseState.staffMap };
  const pricingMap = { ...baseState.pricingMap };
  const overrides = Array.isArray(session.overrides) ? session.overrides : [];
  const pricingOverrides = Array.isArray(session.pricingOverrides)
    ? session.pricingOverrides
    : [];

  overrides.forEach((override) => {
    const row = override?.row ? String(override.row) : "";
    const col = Number(override?.col);
    if (!row || !Number.isFinite(col) || col <= 0) {
      return;
    }

    if (override?.status === "staff") {
      staffMap[getCellKey(row, col)] = true;
    }
  });

  pricingOverrides.forEach((override) => {
    const row = override?.row ? String(override.row) : "";
    const col = Number(override?.col);
    const pricingId = override?.pricingId?._id ?? override?.pricingId ?? "";

    if (!row || !Number.isFinite(col) || col <= 0 || !pricingId) {
      return;
    }

    pricingMap[getCellKey(row, col)] = String(pricingId);
  });

  return {
    ...baseState,
    staffMap,
    pricingMap,
  };
};

const parseCellKey = (key) => {
  const [row, col] = String(key).split("-");
  const colValue = Number(col);

  if (!row || !Number.isFinite(colValue)) {
    return null;
  }

  return { row, col: colValue };
};

export default function SessionFormModal({
  mode = "create",
  event,
  session = null,
  events = [],
  allowEventSelection = false,
  rooms,
  sessionTimes,
  pricing,
  roomsError,
  sessionTimesError,
  pricingError,
  onClose,
}) {
  console.log(session);
  const router = useRouter();
  const { toast, showToast } = useToast();
  const isEditing = mode === "edit" && Boolean(session);
  const eventOptions = Array.isArray(events) ? events : [];
  const canSelectEvent = allowEventSelection && !isEditing;
  const [isEventMenuOpen, setIsEventMenuOpen] = useState(false);
  const [eventQuery, setEventQuery] = useState("");
  const [selectedEventId, setSelectedEventId] = useState(() => {
    if (isEditing) {
      return session?.eventId || event?.id || "";
    }

    if (!canSelectEvent) {
      return event?.id || "";
    }

    return event?.id || eventOptions[0]?.id || "";
  });

  const activeEvent = useMemo(() => {
    if (!canSelectEvent) {
      return event || null;
    }

    return (
      eventOptions.find((item) => item.id === selectedEventId) || event || null
    );
  }, [canSelectEvent, event, eventOptions, selectedEventId]);

  const availableVersions = useMemo(() => {
    const raw = Array.isArray(activeEvent?.availableVersions)
      ? activeEvent.availableVersions
      : [];
    const values = raw.filter(Boolean).map((value) => String(value));

    if (session?.version) {
      values.push(String(session.version));
    }

    const unique = Array.from(new Set(values));

    return unique.length ? unique : FALLBACK_VERSIONS;
  }, [activeEvent?.availableVersions, session?.version]);

  const filteredEvents = useMemo(() => {
    if (!canSelectEvent) {
      return [];
    }

    const query = eventQuery.trim().toLowerCase();

    if (!query) {
      return eventOptions;
    }

    return eventOptions.filter((item) =>
      String(item?.name || "")
        .toLowerCase()
        .includes(query)
    );
  }, [canSelectEvent, eventOptions, eventQuery]);

  useEffect(() => {
    if (!canSelectEvent || !isEventMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (eventClick) => {
      if (eventClick.target.closest("[data-event-menu]")) {
        return;
      }
      setIsEventMenuOpen(false);
    };

    const handleEscape = (eventClick) => {
      if (eventClick.key === "Escape") {
        setIsEventMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [canSelectEvent, isEventMenuOpen]);

  useEffect(() => {
    if (!canSelectEvent) {
      return;
    }

    if (
      selectedEventId &&
      eventOptions.some((item) => item.id === selectedEventId)
    ) {
      return;
    }

    if (eventOptions[0]?.id) {
      setSelectedEventId(eventOptions[0].id);
    }
  }, [canSelectEvent, eventOptions, selectedEventId]);

  const resolveTimeIds = (timeValue, fallbackToFirst = true) => {
    if (!Array.isArray(sessionTimes) || sessionTimes.length === 0) {
      return [];
    }

    if (timeValue) {
      const match = sessionTimes.find((item) => item.time === timeValue);
      if (match?.id) {
        return [match.id];
      }
    }

    if (!fallbackToFirst) {
      return [];
    }

    return sessionTimes[0]?.id ? [sessionTimes[0].id] : [];
  };

  const initialRoomId = isEditing
    ? session?.roomId || rooms?.[0]?.id || ""
    : rooms?.[0]?.id || "";

  const [selectedDate, setSelectedDate] = useState(() => {
    if (isEditing) {
      return toDateInputValue(session?.date) || getTodayInputValue();
    }

    return getTodayInputValue();
  });
  const [selectedVersion, setSelectedVersion] = useState(() => {
    if (isEditing) {
      return session?.version || session?.format || availableVersions[0] || "";
    }

    return availableVersions[0] || "";
  });
  const [selectedTimeIds, setSelectedTimeIds] = useState(() =>
    isEditing ? resolveTimeIds(session?.sessionTime, false) : resolveTimeIds()
  );
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId);
  const [pricingState, setPricingState] = useState(() =>
    isEditing
      ? buildPricingStateFromSession(pricing, session)
      : buildPricingState(pricing)
  );
  const [roomLayoutState, setRoomLayoutState] = useState(() => {
    if (!rooms?.length) {
      return {
        rows: [],
        columns: 0,
        layoutMap: {},
        staffMap: {},
        pricingMap: {},
      };
    }

    const baseRoom =
      rooms.find((room) => room.id === initialRoomId) || rooms[0];
    const baseState = buildRoomStateFromRoom(baseRoom);

    return isEditing ? applySessionOverrides(baseState, session) : baseState;
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing) {
      return;
    }

    if (!availableVersions.length) {
      setSelectedVersion("");
      return;
    }

    if (!availableVersions.includes(selectedVersion)) {
      setSelectedVersion(availableVersions[0] || "");
    }
  }, [availableVersions, isEditing, selectedVersion]);

  const selectedRoom = useMemo(() => {
    if (!Array.isArray(rooms) || rooms.length === 0) {
      return null;
    }

    return rooms.find((room) => room.id === selectedRoomId) || rooms[0] || null;
  }, [rooms, selectedRoomId]);

  useEffect(() => {
    if (!selectedRoom) {
      setRoomLayoutState({
        rows: [],
        columns: 0,
        layoutMap: {},
        staffMap: {},
        pricingMap: {},
      });
      return;
    }

    const baseState = buildRoomStateFromRoom(selectedRoom);

    if (isEditing && session?.roomId === selectedRoom.id) {
      setRoomLayoutState(applySessionOverrides(baseState, session));
    } else {
      setRoomLayoutState(baseState);
    }
  }, [selectedRoom, isEditing, session]);

  const seatPricingOptions = useMemo(
    () =>
      (pricing || [])
        .filter((item) => item?.id && item?.name)
        .map((item) => ({
          id: item.id,
          label: `${item.name} (${formatPrice(item.price)})`,
        })),
    [pricing]
  );

  const selectedSessionTimes = useMemo(() => {
    if (!Array.isArray(sessionTimes)) {
      return [];
    }

    return sessionTimes.filter((time) => selectedTimeIds.includes(time.id));
  }, [sessionTimes, selectedTimeIds]);

  const warnings = [roomsError, sessionTimesError, pricingError].filter(
    Boolean
  );
  const eventMeta = formatEventMeta(activeEvent);

  const handleSubmit = async (eventSubmit) => {
    eventSubmit.preventDefault();

    const targetEvent = activeEvent;

    if (!targetEvent?.id) {
      setFormError("Veuillez choisir un événement.");
      return;
    }

    if (isEditing && !session?.id) {
      setFormError("Identifiant de la séance manquant.");
      return;
    }

    if (!selectedDate) {
      setFormError("Veuillez choisir une date.");
      return;
    }

    if (!selectedVersion) {
      setFormError("Veuillez choisir une langue.");
      return;
    }

    if (!selectedRoom?.id) {
      setFormError("Veuillez choisir une salle.");
      return;
    }

    if (!selectedSessionTimes.length) {
      setFormError(
        isEditing
          ? "Veuillez sélectionner un horaire."
          : "Veuillez sélectionner au moins un horaire."
      );
      return;
    }

    if (isEditing && selectedSessionTimes.length !== 1) {
      setFormError("Veuillez sélectionner un seul horaire.");
      return;
    }

    const baseSeats = countSeats(roomLayoutState);
    const staffSeats = Object.keys(roomLayoutState.staffMap || {}).filter(
      (key) => roomLayoutState.layoutMap[key] !== "couloir"
    );
    const totalSeats = Math.max(0, baseSeats - staffSeats.length);
    const soldSeats =
      isEditing &&
      Number.isFinite(session?.totalSeats) &&
      Number.isFinite(session?.availableSeats)
        ? Math.max(session.totalSeats - session.availableSeats, 0)
        : 0;
    const availableSeats = Math.max(0, totalSeats - soldSeats);

    const overrides = staffSeats
      .map((key) => parseCellKey(key))
      .filter(Boolean)
      .map((cell) => ({ ...cell, status: "staff" }));

    const pricingOverrides = Object.entries(roomLayoutState.pricingMap || {})
      .filter(([, pricingId]) => pricingId)
      .map(([key, pricingId]) => ({ cell: parseCellKey(key), pricingId }))
      .filter((item) => item.cell)
      .map(({ cell, pricingId }) => ({
        ...cell,
        pricingId,
      }));

    const pricingLimits = [];
    for (const item of pricing || []) {
      const state = pricingState[item.id];
      if (!state || !state.enabled) {
        continue;
      }

      if (!state.quota || !String(state.quota).trim()) {
        continue;
      }

      const parsed = Number.parseInt(String(state.quota).replace(",", "."), 10);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setFormError("Veuillez saisir un quota valide.");
        return;
      }

      pricingLimits.push({ pricingId: item.id, maxTickets: parsed });
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const result = isEditing
        ? await updateSession(
            session?.id,
            {
              eventId: targetEvent.id,
              date: new Date(selectedDate).toISOString(),
              sessionTime: selectedSessionTimes[0].time,
              version: selectedVersion,
              roomId: selectedRoom.id,
              totalSeats,
              availableSeats,
              overrides,
              pricingOverrides,
              pricingLimits,
            },
            targetEvent.id
          )
        : await createSessions({
            eventId: targetEvent.id,
            date: new Date(selectedDate).toISOString(),
            sessionTimes: selectedSessionTimes.map((time) => time.time),
            version: selectedVersion,
            roomId: selectedRoom.id,
            totalSeats,
            availableSeats,
            overrides,
            pricingOverrides,
            pricingLimits,
          });

      if (!result.ok) {
        const message = result.message || "Création impossible.";
        setFormError(message);
        showToast(message, "error");
        return;
      }

      if (isEditing) {
        showToast("Séance mise à jour.", "success");
      } else {
        showToast(
          `${
            result.created || selectedSessionTimes.length
          } séance(s) créée(s).`,
          "success"
        );
      }
      router.refresh();
      onClose();
    } catch {
      setFormError("Création impossible.");
      showToast("Création impossible.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePricing = (id) => {
    setPricingState((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { enabled: true, quota: "" }),
        enabled: !(prev[id]?.enabled ?? true),
      },
    }));
  };

  const handleQuotaChange = (id, value) => {
    setPricingState((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { enabled: true, quota: "" }),
        quota: value,
      },
    }));
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[95vh] overflow-hidden fade-up"
          onClick={(eventClick) => eventClick.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div>
              <h2 className="font-secondary text-xl font-semibold text-primary">
                {isEditing ? TEXT.titleEdit : TEXT.titleCreate}
              </h2>
              <p className="text-sm text-slate-500">
                {isEditing ? TEXT.subtitleEdit : TEXT.subtitleCreate}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Fermer"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>

          <form
            className="flex-1 flex flex-col min-h-0"
            onSubmit={handleSubmit}
          >
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {warnings.length ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 space-y-1">
                  {warnings.map((warning, index) => (
                    <p key={`${warning}-${index}`}>{warning}</p>
                  ))}
                </div>
              ) : null}

              {formError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              ) : null}

              <div>
                {canSelectEvent ? (
                  <div className="relative mb-4" data-event-menu>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      {TEXT.eventLabel}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsEventMenuOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:border-primary/50"
                    >
                      <span className="truncate">
                        {activeEvent?.name || TEXT.eventPlaceholder}
                      </span>
                      <Icon
                        name="chevronDown"
                        className="h-4 w-4 text-slate-400"
                      />
                    </button>
                    {isEventMenuOpen ? (
                      <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                        <div className="border-b border-slate-100 px-3 py-2">
                          <div className="relative">
                            <Icon
                              name="search"
                              className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            />
                            <input
                              type="text"
                              value={eventQuery}
                              onChange={(eventChange) =>
                                setEventQuery(eventChange.target.value)
                              }
                              placeholder={TEXT.eventSearchPlaceholder}
                              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </div>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {filteredEvents.length ? (
                            filteredEvents.map((item) => {
                              const isActive = item.id === selectedEventId;
                              const shortId = item.id
                                ? item.id.slice(-6).toUpperCase()
                                : "";

                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedEventId(item.id);
                                    setEventQuery("");
                                    setIsEventMenuOpen(false);
                                  }}
                                  className={`w-full px-4 py-2 text-left transition ${
                                    isActive
                                      ? "bg-primary/10 text-primary"
                                      : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="text-sm font-semibold">
                                    {item.name || "-"}
                                  </div>
                                  {shortId ? (
                                    <div className="text-xs text-slate-500">
                                      ID: #{shortId}
                                    </div>
                                  ) : null}
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-4 py-3 text-sm text-slate-500">
                              {TEXT.eventEmpty}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="relative h-16 w-12 overflow-hidden rounded-lg bg-slate-200">
                    {activeEvent?.poster ? (
                      <Image
                        src={activeEvent.poster}
                        alt={activeEvent.name || "Poster"}
                        fill
                        sizes="48px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-500">
                        {activeEvent?.name ? activeEvent.name.slice(0, 1) : "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-slate-900 truncate">
                      {activeEvent?.name || "-"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {eventMeta || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    {TEXT.date}
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(eventChange) =>
                      setSelectedDate(eventChange.target.value)
                    }
                    className={INPUT_CLASSES}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    {TEXT.language}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableVersions.map((version) => {
                      const isActive = selectedVersion === version;
                      return (
                        <button
                          key={version}
                          type="button"
                          onClick={() => setSelectedVersion(version)}
                          className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                            isActive
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-slate-200 text-slate-500 hover:border-primary hover:text-primary"
                          }`}
                        >
                          {VERSION_LABELS[version] || version}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  {TEXT.sessionTime}
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  {isEditing
                    ? TEXT.sessionTimeHintEdit
                    : TEXT.sessionTimeHintCreate}
                </p>
                {sessionTimes?.length ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {sessionTimes.map((time) => {
                      const isActive = selectedTimeIds.includes(time.id);
                      return (
                        <button
                          key={time.id}
                          type="button"
                          onClick={() =>
                            setSelectedTimeIds((prev) => {
                              if (isEditing) {
                                return prev.includes(time.id)
                                  ? prev
                                  : [time.id];
                              }

                              return prev.includes(time.id)
                                ? prev.filter((id) => id !== time.id)
                                : [...prev, time.id];
                            })
                          }
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                            isActive
                              ? "border-primary bg-primary text-white shadow-sm"
                              : "border-slate-200 text-slate-600 hover:border-primary hover:text-primary"
                          }`}
                        >
                          {time.time}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">{TEXT.noTimes}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  {TEXT.room}
                </label>
                {rooms?.length ? (
                  <div className="relative">
                    <select
                      value={selectedRoomId}
                      onChange={(eventChange) =>
                        setSelectedRoomId(eventChange.target.value)
                      }
                      className={`${INPUT_CLASSES} appearance-none pr-10`}
                    >
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                          {room.capacity ? ` • ${room.capacity} places` : ""}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                      <Icon name="chevronDown" className="h-4 w-4" />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">{TEXT.noRooms}</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {TEXT.pricing}
                  </p>
                  <span className="text-xs text-slate-500">
                    {selectedRoom?.name || "-"}
                  </span>
                </div>
                {pricing?.length ? (
                  <div className="divide-y divide-slate-100">
                    {pricing.map((item) => {
                      const state = pricingState[item.id] || {
                        enabled: true,
                        quota: "",
                      };
                      return (
                        <div
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {item.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatPrice(item.price)}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <input
                              type="text"
                              value={state.quota}
                              onChange={(eventChange) =>
                                handleQuotaChange(
                                  item.id,
                                  eventChange.target.value
                                )
                              }
                              disabled={!state.enabled}
                              placeholder={state.enabled ? "∞" : "-"}
                              className={`w-20 rounded-lg border px-2 py-1 text-center text-xs ${
                                state.enabled
                                  ? "border-slate-200 bg-white text-slate-700"
                                  : "border-slate-200 bg-slate-50 text-slate-400"
                              }`}
                            />
                            <button
                              type="button"
                              role="switch"
                              aria-checked={state.enabled}
                              onClick={() => handleTogglePricing(item.id)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full border-2 border-transparent transition ${
                                state.enabled ? "bg-primary" : "bg-slate-200"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                                  state.enabled
                                    ? "translate-x-4"
                                    : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-4 text-sm text-slate-500">
                    {TEXT.noPricing}
                  </div>
                )}
              </div>

              <SessionRoomEditor
                rows={roomLayoutState.rows}
                columns={roomLayoutState.columns}
                layoutMap={roomLayoutState.layoutMap}
                staffMap={roomLayoutState.staffMap}
                pricingMap={roomLayoutState.pricingMap}
                pricingOptions={seatPricingOptions}
                onChange={(updates) =>
                  setRoomLayoutState((prev) => ({ ...prev, ...updates }))
                }
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:text-red-600"
                disabled={isSubmitting}
              >
                {TEXT.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary/90 disabled:opacity-70"
              >
                <Icon name="check" className="h-4 w-4" />
                {isSubmitting
                  ? isEditing
                    ? "Enregistrement..."
                    : "Création..."
                  : isEditing
                  ? TEXT.update
                  : TEXT.create}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Toast toast={toast} />
    </>
  );
}
