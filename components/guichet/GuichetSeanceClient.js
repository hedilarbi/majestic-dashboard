"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

import SeatMapSection from "@/components/guichet/SeatMapSection";
import SeanceAside from "@/components/guichet/SeanceAside";
import { useUser } from "@/components/dashboard/user-context";
import { Icon } from "@/components/ui/icons";
import Toast from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

import {
  resolvePricingItems,
  resolveSeanceInfo,
} from "@/lib/guichet/seance-utils";
import {
  buildSeatRows,
  normalizeSeatsPayload,
  seatKey,
} from "@/lib/guichet/seat-utils";
import { getExpiresAtMs } from "@/lib/guichet/time-utils";
import { resolveSocketUrl } from "@/lib/guichet/api-client";
import { normalizeReservationResponse } from "@/lib/guichet/reservation-utils";
import { fetchSeatMap } from "@/services/guichet-seatmap-client";
import {
  cancelReservation,
  reserveSeats,
} from "@/services/guichet-reservations-client";

const mergeSeatData = (primary, fallback) => {
  if (!primary) {
    return fallback;
  }
  if (!fallback) {
    return primary;
  }

  return {
    ...fallback,
    ...primary,
    pricingOverride: primary.pricingOverride ?? fallback.pricingOverride,
    pricingOverrideId: primary.pricingOverrideId ?? fallback.pricingOverrideId,
  };
};

export default function GuichetSeanceClient({ seanceId, socketUrl: socketUrlProp = "" }) {
  const router = useRouter();
  const { user } = useUser();
  const { toast, showToast } = useToast();
  const userId = user?._id ?? user?.id ?? "";
  const [seatRows, setSeatRows] = useState([]);
  const [maxCols, setMaxCols] = useState(0);
  const [seance, setSeance] = useState({});
  const [pricingItems, setPricingItems] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [myReservation, setMyReservation] = useState(null);
  const [reservationExpired, setReservationExpired] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const indexRef = useRef(new Map());
  const pricingOverrideRef = useRef(new Map());
  const pendingSeatActionsRef = useRef(new Map());
  const nextSeatOpRef = useRef(0);
  const selectedSeatKeysRef = useRef(new Set());
  const selectedSeatsRef = useRef([]);
  const seatRowsRef = useRef([]);

  const mergeSelectedSeats = useCallback((reservationSeats = []) => {
    const safeReservationSeats = Array.isArray(reservationSeats)
      ? reservationSeats.filter(
          (seat) => seat && seat.row !== undefined && seat.col !== undefined,
        )
      : [];
    const reservationKeys = new Set(
      safeReservationSeats.map((seat) => seatKey(seat.row, seat.col)),
    );
    const pendingReservedSeats = selectedSeatsRef.current.filter((seat) => {
      if (!seat || seat.row === undefined || seat.col === undefined) {
        return false;
      }
      const key = seatKey(seat.row, seat.col);
      const pending = pendingSeatActionsRef.current.get(key);
      return pending?.action === "reserve" && !reservationKeys.has(key);
    });
    const pendingReserveKeys = new Set(
      pendingReservedSeats.map((seat) => seatKey(seat.row, seat.col)),
    );
    const pendingReleaseKeys = new Set(
      Array.from(pendingSeatActionsRef.current.entries())
        .filter(([, value]) => value?.action === "release")
        .map(([key]) => key),
    );
    const preserveExisting = pendingSeatActionsRef.current.size > 0;
    const stableSelectedSeats = preserveExisting
      ? selectedSeatsRef.current.filter((seat) => {
          if (!seat || seat.row === undefined || seat.col === undefined) {
            return false;
          }
          const key = seatKey(seat.row, seat.col);
          if (reservationKeys.has(key)) {
            return false;
          }
          if (pendingReserveKeys.has(key)) {
            return false;
          }
          if (pendingReleaseKeys.has(key)) {
            return false;
          }
          return true;
        })
      : [];

    const merged = new Map();
    const mergeList = (list = []) => {
      list.forEach((seat) => {
        if (!seat || seat.row === undefined || seat.col === undefined) {
          return;
        }
        const key = seatKey(seat.row, seat.col);
        const existing = merged.get(key);
        merged.set(key, mergeSeatData(seat, existing));
      });
    };

    mergeList(safeReservationSeats);
    mergeList(pendingReservedSeats);
    mergeList(stableSelectedSeats);

    return Array.from(merged.values());
  }, []);

  const syncSelectedSeats = useCallback(
    (reservationSeats = []) => {
      const merged = mergeSelectedSeats(reservationSeats);
      setSelectedSeats(merged);
      selectedSeatsRef.current = merged;
      selectedSeatKeysRef.current = new Set(
        merged.map((seat) => seatKey(seat.row, seat.col)),
      );
    },
    [mergeSelectedSeats],
  );

  const removeSelectedSeats = useCallback((seatsToRemove = []) => {
    if (!seatsToRemove.length) {
      return;
    }

    const keysToRemove = new Set(
      seatsToRemove
        .filter((seat) => seat && seat.row !== undefined && seat.col !== undefined)
        .map((seat) => seatKey(seat.row, seat.col)),
    );

    if (!keysToRemove.size) {
      return;
    }

    const nextSelected = selectedSeatsRef.current.filter(
      (seat) => !keysToRemove.has(seatKey(seat.row, seat.col)),
    );

    selectedSeatsRef.current = nextSelected;
    selectedSeatKeysRef.current = new Set(
      nextSelected.map((seat) => seatKey(seat.row, seat.col)),
    );
    setSelectedSeats(nextSelected);

    setMyReservation((prev) => {
      if (!prev) {
        return prev;
      }
      const nextReservation = {
        ...prev,
        seats: nextSelected,
      };
      return nextReservation;
    });
  }, []);

  const normalizeOverrideMeta = useCallback((raw) => {
    if (!raw) {
      return null;
    }

    if (typeof raw === "string" || typeof raw === "number") {
      return { id: String(raw) };
    }

    if (typeof raw !== "object") {
      return null;
    }

    const nestedPricing =
      raw.pricingId && typeof raw.pricingId === "object"
        ? raw.pricingId
        : null;
    const source = nestedPricing || raw;
    const id =
      source?._id ??
      source?.id ??
      raw?.pricingId ??
      raw?.pricingOverrideId ??
      raw?.pricingOverride ??
      raw?.id ??
      "";
    const name =
      source?.name ??
      source?.nom ??
      raw?.label ??
      raw?.name ??
      raw?.nom ??
      "";
    const price =
      source?.price ??
      source?.prix ??
      raw?.price ??
      raw?.prix ??
      raw?.amount ??
      raw?.montant ??
      null;

    if (!id && !name && price === null) {
      return null;
    }

    return {
      id: id ? String(id) : name ? String(name) : "",
      name,
      price,
    };
  }, []);

  const resolveSeatOverride = useCallback(
    (seat, fallbackOverride = null) => {
      const seatOverride =
        normalizeOverrideMeta(seat?.pricingOverride) ||
        normalizeOverrideMeta(seat?.pricingOverrideId);
      const mapOverride = fallbackOverride
        ? normalizeOverrideMeta(fallbackOverride)
        : null;

      const mergedId =
        seatOverride?.id ||
        mapOverride?.id ||
        (typeof seat?.pricingOverrideId === "string"
          ? seat.pricingOverrideId
          : "");
      const mergedName = seatOverride?.name || mapOverride?.name || "";
      const mergedPrice =
        seatOverride?.price ?? mapOverride?.price ?? null;

      if (!mergedId && !mergedName && mergedPrice === null) {
        return null;
      }

      return {
        id: mergedId || mergedName,
        name: mergedName,
        price: mergedPrice,
      };
    },
    [normalizeOverrideMeta],
  );

  const isPendingReserve = useCallback((key) => {
    return pendingSeatActionsRef.current.get(key)?.action === "reserve";
  }, []);

  const isSeatPending = useCallback((key) => {
    return pendingSeatActionsRef.current.has(key);
  }, []);

  useEffect(() => {
    selectedSeatsRef.current = selectedSeats;
    selectedSeatKeysRef.current = new Set(
      selectedSeats.map((seat) => seatKey(seat.row, seat.col)),
    );
  }, [selectedSeats]);

  useEffect(() => {
    seatRowsRef.current = seatRows;
  }, [seatRows]);

  const selectedSeatKeys = useMemo(
    () => new Set(selectedSeats.map((seat) => seatKey(seat.row, seat.col))),
    [selectedSeats],
  );

  const reservationSeatKeys = useMemo(() => {
    if (!myReservation?.seats?.length) {
      return new Set();
    }

    return new Set(
      myReservation.seats.map((seat) => seatKey(seat.row, seat.col)),
    );
  }, [myReservation]);

  const updateSeatMap = useCallback(
    (seatMap, pricingOverrides = []) => {
      const overrideMap = new Map();

      const mergeOverrideMeta = (existing, incoming) => {
        if (!existing) {
          return incoming;
        }
        if (!incoming) {
          return existing;
        }
        return {
          id: incoming.id || existing.id,
          name: incoming.name || existing.name,
          price:
            incoming.price !== null && incoming.price !== undefined
              ? incoming.price
              : existing.price ?? null,
        };
      };

      const addOverride = (rowValue, colValue, rawOverride) => {
        if (rowValue === undefined || rowValue === null) {
          return;
        }
        const colNumber = Number(colValue);
        if (!Number.isFinite(colNumber)) {
          return;
        }

        const meta = normalizeOverrideMeta(rawOverride);
        if (!meta) {
          return;
        }

        const key = seatKey(rowValue, colNumber);
        const existing = overrideMap.get(key);
        overrideMap.set(key, mergeOverrideMeta(existing, meta));
      };

      const overridesList = Array.isArray(pricingOverrides)
        ? pricingOverrides
        : [];

      overridesList.forEach((override) => {
        if (!override) {
          return;
        }
        const rowValue =
          override?.row ?? override?.rowValue ?? override?.seatRow;
        const colValue =
          override?.col ?? override?.seatCol ?? override?.column;
        const rawOverride =
          override?.pricingId ??
          override?.pricing ??
          override?.tarif ??
          override?.pricingOverride ??
          override?.pricingOverrideId ??
          override;
        addOverride(rowValue, colValue, rawOverride);
      });

      (seatMap || []).forEach((cell) => {
        if (!cell) {
          return;
        }
        const rawOverride =
          cell.pricingOverrideId !== undefined
            ? cell.pricingOverrideId
            : cell.pricingOverride;
        addOverride(cell.row, cell.col, rawOverride);
      });

      const normalizedSeatMap = (seatMap || []).map((cell) => {
        if (!cell) {
          return cell;
        }
        const key = seatKey(cell.row, cell.col);
        const overrideMeta = overrideMap.get(key);
        if (!overrideMeta) {
          return cell;
        }
        return {
          ...cell,
          pricingOverride: overrideMeta,
          pricingOverrideId:
            overrideMeta.id ??
            cell.pricingOverrideId ??
            cell.pricingOverride,
        };
      });

      const {
        rows,
        maxCols: computedMaxCols,
        indexByKey,
      } = buildSeatRows(normalizedSeatMap);
      indexRef.current = indexByKey;
      setSeatRows(rows);
      setMaxCols(computedMaxCols);

      pricingOverrideRef.current = overrideMap;
    },
    [normalizeOverrideMeta],
  );

  const applyPricingOverrides = useCallback((seats = []) => {
    if (!seats.length) {
      return [];
    }
    const overrideMap = pricingOverrideRef.current;
    if (!overrideMap || overrideMap.size === 0) {
      return seats;
    }
    return seats.map((seat) => {
      if (!seat || seat.row === undefined || seat.col === undefined) {
        return seat;
      }
      const override = overrideMap.get(seatKey(seat.row, seat.col));
      const overrideMeta = resolveSeatOverride(seat, override);
      if (!overrideMeta) {
        return seat;
      }
      const overrideId = overrideMeta.id || seat.pricingOverrideId;
      return {
        ...seat,
        pricingOverrideId: overrideId,
        pricingOverride: overrideMeta,
      };
    });
  }, [resolveSeatOverride]);

  const updateSeatStatuses = useCallback((seats, status, options = {}) => {
    if (!seats?.length) {
      return;
    }

    const { keepSelected = false } = options;
    const seatKeys = new Set(
      seats
        .filter(
          (seat) => seat && seat.row !== undefined && seat.col !== undefined,
        )
        .map((seat) => seatKey(seat.row, seat.col)),
    );

    setSeatRows((prevRows) => {
      if (!prevRows.length || seatKeys.size === 0) {
        return prevRows;
      }

      const nextRows = [...prevRows];
      const updatedRows = new Map();

      seats.forEach((seat) => {
        if (!seat || seat.row === undefined || seat.col === undefined) {
          return;
        }

        const key = seatKey(seat.row, seat.col);
        const position = indexRef.current.get(key);

        if (!position) {
          return;
        }

        const { rowIndex, colIndex } = position;
        let row = updatedRows.get(rowIndex);

        if (!row) {
          row = { ...nextRows[rowIndex], cells: [...nextRows[rowIndex].cells] };
          updatedRows.set(rowIndex, row);
          nextRows[rowIndex] = row;
        }

        const cell = row.cells[colIndex];
        if (!cell) {
          return;
        }

        row.cells[colIndex] = { ...cell, status };
      });

      return nextRows;
    });

    if (status !== "available" && !keepSelected) {
      setSelectedSeats((prev) =>
        prev.filter((seat) => {
          const key = seatKey(seat.row, seat.col);
          if (!seatKeys.has(key)) {
            return true;
          }
          const pending = pendingSeatActionsRef.current.get(key);
          if (pending?.action) {
            return true;
          }
          return selectedSeatKeysRef.current.has(key);
        }),
      );
    }
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const loadSeatMap = async () => {
      if (!seanceId) {
        return;
      }

      setIsLoading(true);
      setLoadError("");

      try {
        const { ok, data } = await fetchSeatMap(seanceId, {
          signal: controller.signal,
        });
        console.log("[guichet/seance] seatMap response", { seanceId, ok, data });

        if (!ok) {
          throw new Error("Impossible de charger la salle.");
        }

        if (!active) {
          return;
        }

        const seatMap = Array.isArray(data?.seatMap) ? data.seatMap : [];
        const pricingOverrides =
          (Array.isArray(data?.pricingOverrides) && data.pricingOverrides) ||
          (Array.isArray(data?.session?.pricingOverrides) &&
            data.session.pricingOverrides) ||
          (Array.isArray(data?.seance?.pricingOverrides) &&
            data.seance.pricingOverrides) ||
          (Array.isArray(data?.room?.pricingOverrides) &&
            data.room.pricingOverrides) ||
          [];
        updateSeatMap(seatMap, pricingOverrides);
        setSeance(resolveSeanceInfo(data));
        const resolvedPricing = resolvePricingItems(data);
        setPricingItems(resolvedPricing);

        const reservation = normalizeReservationResponse({
          reservation: data?.myReservation,
        });
        if (reservation.reservationId && reservation.seats.length > 0) {
          const seatsWithOverrides = applyPricingOverrides(reservation.seats);
          console.log("[guichet/seance] initial reservation", {
            seanceId,
            reservationId: reservation.reservationId,
            seats: seatsWithOverrides,
          });
          setMyReservation({
            reservationId: reservation.reservationId,
            expiresAt: reservation.expiresAt,
            seats: seatsWithOverrides,
          });
          syncSelectedSeats(seatsWithOverrides);
          setReservationExpired(false);
        } else {
          setMyReservation(null);
          setSelectedSeats([]);
          setTimeLeftMs(null);
        }
      } catch (error) {
        if (!active || error.name === "AbortError") {
          return;
        }
        setLoadError("Impossible de charger le plan de salle.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    setSelectedSeats([]);
    setMyReservation(null);
    setReservationExpired(false);
    setPricingItems([]);
    loadSeatMap();

    return () => {
      active = false;
      controller.abort();
    };
  }, [applyPricingOverrides, seanceId, syncSelectedSeats, updateSeatMap]);

  useEffect(() => {
    const socketUrl = resolveSocketUrl(socketUrlProp);
    if (!socketUrl || !seanceId) {
      return undefined;
    }

    const socket = io(socketUrl, {
      transports: ["websocket"],
      reconnection: true,
      timeout: 10000,
    });

    socket.emit("join-session", { sessionId: seanceId });

    const handleReserved = (payload) => {
      const payloadUserId = payload?.userId ? String(payload.userId) : "";
      const isCurrentUser = payloadUserId && payloadUserId === String(userId);
      const payloadSeats = normalizeSeatsPayload(payload);

      if (isCurrentUser) {
        const reservation = normalizeReservationResponse(payload);
        if (!reservation.reservationId || reservation.seats.length === 0) {
          return;
        }

        const seatsWithOverrides = applyPricingOverrides(reservation.seats);
        console.log("[guichet/seance] socket reservation", {
          seanceId,
          reservationId: reservation.reservationId,
          seats: seatsWithOverrides,
        });
        setReservationExpired(false);
        setMyReservation({
          reservationId: reservation.reservationId,
          expiresAt: reservation.expiresAt,
          seats: seatsWithOverrides,
        });
        syncSelectedSeats(seatsWithOverrides);
        return;
      }

      const otherSeats = [];

      payloadSeats.forEach((seat) => {
        if (!seat || seat.row === undefined || seat.col === undefined) {
          return;
        }

        const key = seatKey(seat.row, seat.col);
        if (isSeatPending(key) || selectedSeatKeysRef.current.has(key)) {
          return;
        }

        otherSeats.push(seat);
      });

      if (otherSeats.length) {
        updateSeatStatuses(otherSeats, "reserved");
      }

      if (!isCurrentUser) {
        return;
      }

      const reservation = normalizeReservationResponse(payload);
      if (!reservation.reservationId || reservation.seats.length === 0) {
        return;
      }

      const seatsWithOverrides = applyPricingOverrides(reservation.seats);
      setReservationExpired(false);
      setMyReservation({
        reservationId: reservation.reservationId,
        expiresAt: reservation.expiresAt,
        seats: seatsWithOverrides,
      });
      syncSelectedSeats(seatsWithOverrides);
    };

    const handleReleased = (payload) => {
      const payloadUserId = payload?.userId ? String(payload.userId) : "";
      const isCurrentUser = payloadUserId && payloadUserId === String(userId);
      const payloadSeats = normalizeSeatsPayload(payload);

      if (!isCurrentUser) {
        const releasableSeats = [];

        payloadSeats.forEach((seat) => {
          if (!seat || seat.row === undefined || seat.col === undefined) {
            return;
          }

          const key = seatKey(seat.row, seat.col);
          if (isSeatPending(key) || selectedSeatKeysRef.current.has(key)) {
            return;
          }

          releasableSeats.push(seat);
        });

        if (releasableSeats.length) {
          updateSeatStatuses(releasableSeats, "available");
        }

        return;
      }

      if (payloadSeats.length) {
        updateSeatStatuses(payloadSeats, "available");
      }

      const reservation = normalizeReservationResponse(payload);
      if (reservation.reservationId && reservation.seats.length > 0) {
        const seatsWithOverrides = applyPricingOverrides(reservation.seats);
        setReservationExpired(false);
        setMyReservation({
          reservationId: reservation.reservationId,
          expiresAt: reservation.expiresAt,
          seats: seatsWithOverrides,
        });
        syncSelectedSeats(seatsWithOverrides);
        return;
      }

      if (payloadSeats.length) {
        removeSelectedSeats(payloadSeats);
        if (
          selectedSeatsRef.current.length === 0 &&
          pendingSeatActionsRef.current.size === 0
        ) {
          setMyReservation(null);
          setReservationExpired(false);
          setTimeLeftMs(null);
        }
        return;
      }

      if (pendingSeatActionsRef.current.size === 0) {
        setMyReservation(null);
        setSelectedSeats([]);
        setReservationExpired(false);
        setTimeLeftMs(null);
        selectedSeatsRef.current = [];
        selectedSeatKeysRef.current = new Set();
      }
    };

    const handleBooked = (payload) => {
      updateSeatStatuses(normalizeSeatsPayload(payload), "booked");
    };

    const handleConnectError = (error) => {
      console.error("Socket connection error:", error?.message || error);
    };

    socket.on("seats-reserved", handleReserved);
    socket.on("seats-released", handleReleased);
    socket.on("seats-booked", handleBooked);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.emit("leave-session", { sessionId: seanceId });
      socket.off("seats-reserved", handleReserved);
      socket.off("seats-released", handleReleased);
      socket.off("seats-booked", handleBooked);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
    };
  }, [
    applyPricingOverrides,
    isPendingReserve,
    isSeatPending,
    removeSelectedSeats,
    seanceId,
    socketUrlProp,
    updateSeatStatuses,
    syncSelectedSeats,
    userId,
  ]);

  useEffect(() => {
    const expiresAtMs = getExpiresAtMs(myReservation?.expiresAt);

    if (!expiresAtMs) {
      setTimeLeftMs(null);
      return undefined;
    }

    let active = true;

    const tick = () => {
      if (!active) {
        return;
      }

      const diff = expiresAtMs - Date.now();
      if (diff <= 0) {
        const expiredSeats = myReservation?.seats || [];
        if (expiredSeats.length) {
          updateSeatStatuses(expiredSeats, "available");
        }
        pendingSeatActionsRef.current.clear();
        selectedSeatsRef.current = [];
        selectedSeatKeysRef.current = new Set();
        setTimeLeftMs(0);
        setReservationExpired(true);
        setMyReservation(null);
        setSelectedSeats([]);
        return;
      }

      setTimeLeftMs(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [myReservation?.expiresAt, myReservation?.seats, updateSeatStatuses]);

  const handleToggleSeat = useCallback(
    async (seat) => {
      if (!seat) {
        return;
      }

      const key = seatKey(seat.row, seat.col);
      const exists = selectedSeatKeysRef.current.has(key);
      const override = pricingOverrideRef.current.get(key);
      const overrideMeta = resolveSeatOverride(null, override);
      const overrideId = overrideMeta?.id;
      const toggledSeat = overrideId
        ? {
            row: seat.row,
            col: seat.col,
            pricingOverrideId: overrideId,
            pricingOverride: overrideMeta,
          }
        : { row: seat.row, col: seat.col };
      const action = exists ? "release" : "reserve";

      const pending = pendingSeatActionsRef.current.get(key);
      if (pending?.action === action) {
        return;
      }

      if (!userId) {
        showToast("Utilisateur non identifié. Veuillez vous reconnecter.", "error");
        return;
      }

      const prevSelectedSeats = selectedSeatsRef.current;
      const position = indexRef.current.get(key);
      const prevStatus = position
        ? seatRowsRef.current?.[position.rowIndex]?.cells?.[position.colIndex]?.status
        : undefined;
      const fallbackStatus = exists ? "reserved" : "available";
      const nextSelectedSeats = exists
        ? prevSelectedSeats.filter(
            (item) => seatKey(item.row, item.col) !== key,
          )
        : [...prevSelectedSeats, toggledSeat];

      const opId = nextSeatOpRef.current + 1;
      nextSeatOpRef.current = opId;
      pendingSeatActionsRef.current.set(key, {
        action,
        opId,
      });

      selectedSeatsRef.current = nextSelectedSeats;
      selectedSeatKeysRef.current = new Set(
        nextSelectedSeats.map((item) => seatKey(item.row, item.col)),
      );

      setSelectedSeats(nextSelectedSeats);
      updateSeatStatuses([toggledSeat], exists ? "available" : "reserved", {
        keepSelected: true,
      });

      let errorMessage = "";
      let didSucceed = false;

      try {
        const { ok, status, data } = await reserveSeats({
          sessionId: seanceId,
          seats: [toggledSeat],
          action,
        });

        if (status === 409) {
          errorMessage =
            "Certains sièges viennent d'être réservés. Veuillez réessayer.";
          throw new Error("conflict");
        }

        if (!ok) {
          errorMessage = "Impossible de réserver.";
          throw new Error("reserve_failed");
        }

        const reservation = normalizeReservationResponse(data);
        const seatsWithOverrides = applyPricingOverrides(reservation.seats);

        if (pendingSeatActionsRef.current.get(key)?.opId !== opId) {
          return;
        }

        setReservationExpired(false);
        if (!reservation.reservationId || reservation.seats.length === 0) {
          setMyReservation(null);
          setSelectedSeats([]);
          setTimeLeftMs(null);
        } else {
          if (action === "reserve" && toggledSeat.pricingOverrideId) {
            console.log("[guichet/seance] reservation with fixed pricing seat", {
              seanceId,
              reservationId: reservation.reservationId,
              seats: seatsWithOverrides,
            });
          }
          syncSelectedSeats(seatsWithOverrides);
          setMyReservation({
            reservationId: reservation.reservationId,
            expiresAt: reservation.expiresAt,
            seats: seatsWithOverrides,
          });
        }

        didSucceed = true;
      } catch (error) {
        if (pendingSeatActionsRef.current.get(key)?.opId !== opId) {
          return;
        }
        const message =
          errorMessage || "Une erreur est survenue. Merci de réessayer.";
        showToast(message, "error");
        setSelectedSeats(prevSelectedSeats);
        selectedSeatsRef.current = prevSelectedSeats;
        selectedSeatKeysRef.current = new Set(
          prevSelectedSeats.map((item) => seatKey(item.row, item.col)),
        );
        updateSeatStatuses([toggledSeat], prevStatus ?? fallbackStatus, {
          keepSelected: true,
        });
      } finally {
        if (pendingSeatActionsRef.current.get(key)?.opId === opId) {
          pendingSeatActionsRef.current.delete(key);
        }
      }
    },
    [
      applyPricingOverrides,
      resolveSeatOverride,
      seanceId,
      showToast,
      syncSelectedSeats,
      updateSeatStatuses,
      userId,
    ],
  );

  const cancelCurrentReservation = useCallback(async () => {
    if (!myReservation?.reservationId || isCancelling) {
      return !myReservation?.reservationId;
    }

    setIsCancelling(true);

    try {
      const { ok } = await cancelReservation(myReservation.reservationId);

      if (!ok) {
        throw new Error("cancel_failed");
      }

      updateSeatStatuses(myReservation.seats || [], "available");
      setMyReservation(null);
      setReservationExpired(false);
      setTimeLeftMs(null);
      setSelectedSeats([]);
      return true;
    } catch (error) {
      showToast("Impossible d'annuler la réservation.", "error");
      return false;
    } finally {
      setIsCancelling(false);
    }
  }, [isCancelling, myReservation, showToast, updateSeatStatuses]);

  const handleCancelReservation = useCallback(async () => {
    const ok = await cancelCurrentReservation();
    if (ok) {
      showToast("Réservation annulée.", "success");
    }
  }, [cancelCurrentReservation, showToast]);

  const handleBackClick = useCallback(async () => {
    if (isLeaving || isCancelling) {
      return;
    }

    setIsLeaving(true);

    const ok = await cancelCurrentReservation();

    if (ok) {
      router.push("/guichet/vente-de-billet");
      return;
    }

    setIsLeaving(false);
  }, [cancelCurrentReservation, isCancelling, isLeaving, router]);

  const checkoutHref = myReservation?.reservationId
    ? `/guichet/${seanceId}/checkout?reservationId=${myReservation.reservationId}`
    : `/guichet/${seanceId}/checkout`;

  const isActionDisabled = !myReservation;
  const fixedPricingGroups = useMemo(() => {
    if (!selectedSeats.length) {
      return [];
    }

    const pricingById = new Map(
      pricingItems.map((item) => [String(item.id), item]),
    );
    const groups = new Map();

    selectedSeats.forEach((seat) => {
      const overrideMeta = resolveSeatOverride(seat);
      if (!overrideMeta) {
        return;
      }
      const pricingId = String(overrideMeta.id);
      const pricing = pricingById.get(pricingId);
      const entry = groups.get(pricingId) || {
        pricingId,
        label: overrideMeta.name || pricing?.name || "Tarif fixe",
        price: overrideMeta.price ?? pricing?.price,
        seats: [],
      };

      entry.seats.push(`${seat.row}${seat.col}`);
      groups.set(pricingId, entry);
    });

    return Array.from(groups.values());
  }, [pricingItems, resolveSeatOverride, selectedSeats]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBackClick}
          disabled={isLeaving || isCancelling}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition ${
            isLeaving || isCancelling
              ? "cursor-not-allowed opacity-70"
              : "hover:bg-slate-50"
          }`}
          aria-label="Retour aux séances"
        >
          {isLeaving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
          ) : (
            <Icon name="chevronLeft" className="h-4 w-4" />
          )}
        </button>
        {isLeaving ? (
          <span className="text-xs text-slate-500">
            Annulation des réservations...
          </span>
        ) : null}
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <SeatMapSection
          seatRows={seatRows}
          maxCols={maxCols}
          selectedSeatKeys={selectedSeatKeys}
          reservationSeatKeys={reservationSeatKeys}
          onToggleSeat={handleToggleSeat}
          isLoading={isLoading}
          loadError={loadError}
        />
        <SeanceAside
          seance={seance}
          pricingItems={pricingItems}
          fixedPricingGroups={fixedPricingGroups}
          myReservation={myReservation}
          reservationExpired={reservationExpired}
          timeLeftMs={timeLeftMs}
          isCancelling={isCancelling}
          checkoutHref={checkoutHref}
          isActionDisabled={isActionDisabled}
          onCancelReservation={handleCancelReservation}
        />
      </div>
      <Toast toast={toast} />
    </div>
  );
}
