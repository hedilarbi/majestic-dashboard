"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/configurations/formatters";
const buildNormalizedSeatKey = (row, col) => {
  const normalizedRow = String(row ?? "").trim();
  const numericCol = Number(col);
  return `${normalizedRow}:${numericCol}`;
};

const formatSeatLabel = (seat) => {
  if (!seat) {
    return "";
  }
  return `${seat.row}${seat.col}`;
};

const toNumber = (value) => {
  const numeric = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeSubscriptionCode = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim().toUpperCase().replace(/\s+/g, "");
  if (!normalized) {
    return "";
  }

  return /^[A-Z0-9-]{4,64}$/.test(normalized) ? normalized : "";
};

const normalizePromoCode = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim().toUpperCase().replace(/\s+/g, "");
  if (!normalized) {
    return "";
  }

  return /^[A-Z0-9-]{2,64}$/.test(normalized) ? normalized : "";
};

const normalizeOverrideMeta = (raw) => {
  if (!raw) {
    return null;
  }

  if (typeof raw === "string") {
    const normalized = raw.trim();
    if (!normalized) {
      return null;
    }
    const lowered = normalized.toLowerCase();
    if (lowered === "null" || lowered === "undefined") {
      return null;
    }
    return { id: normalized };
  }

  if (typeof raw === "number") {
    return Number.isFinite(raw) ? { id: String(raw) } : null;
  }

  if (typeof raw !== "object") {
    return null;
  }

  const nestedPricing =
  raw.pricingId && typeof raw.pricingId === "object" ? raw.pricingId : null;
  const source = nestedPricing || raw;
  const id =
  source?._id ??
  source?.id ??
  raw?.pricingId ??
  raw?.pricingOverrideId ??
  raw?.id ??
  "";
  const name =
  source?.name ?? source?.nom ?? raw?.label ?? raw?.name ?? raw?.nom ?? "";
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
    price
  };
};

const resolveSeatOverride = (seat) => {
  const override =
  normalizeOverrideMeta(seat?.pricingOverride) ||
  normalizeOverrideMeta(seat?.pricingOverrideId);
  if (!override) {
    return null;
  }
  return override;
};

const formatSessionDateTime = (dateValue, timeValue) => {
  const formattedTime = typeof timeValue === "string" ? timeValue.trim() : "";
  if (!dateValue) {
    return formattedTime || "";
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return formattedTime || "";
  }

  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);

  return formattedTime ? `${formattedDate} - ${formattedTime}` : formattedDate;
};

const buildTicketQrValue = (ticket) => {
  if (!ticket || typeof ticket !== "object") {
    return "";
  }

  if (ticket.qrCodeUrl) {
    return String(ticket.qrCodeUrl);
  }

  return String(ticket.code || "").trim();
};

const buildQrImageSrc = (ticket) => {
  const value = buildTicketQrValue(ticket);
  if (!value) {
    return "";
  }

  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    value
  )}`;
};

function TicketPrintCard({ ticket, booking }) {
  const bookingNumber = booking?.bookingNumber || "";
  const session = booking?.session || {};
  const eventName = session?.event?.name || "Le majestic";
  const sessionDateTime = formatSessionDateTime(
    session?.date,
    session?.sessionTime
  );
  const qrSrc = buildQrImageSrc(ticket);

  return (
    <article className="guichet-ticket-print-sheet relative mx-auto flex h-[123mm] min-h-[123mm] w-[79mm] min-w-[79mm] max-w-[79mm] flex-col rounded-md border border-slate-300 bg-white px-4 py-4 text-center text-black shadow-sm">
      <div className="mx-auto mb-3 flex h-16 items-center justify-center">
        <Image
          src="/images/logo.png"
          alt="Le Majestic"
          width={260}
          height={82}
          className="h-full w-auto object-contain"
          priority={false} />

      </div>

      <p className="mb-1 text-center text-[15px] font-black uppercase tracking-[0.08em]">
        Le majestic
      </p>
      <p className="px-1 text-center text-[18px] font-black leading-tight">
        {eventName}
      </p>
      <p className="mt-2 text-center text-[14px] font-semibold">
        {sessionDateTime}
      </p>
      <p className="mt-2 text-center text-[14px] font-semibold">
        {ticket?.pricingName || "Tarif"} : {formatPrice(ticket?.price)}
      </p>

      <div className="mt-5 flex items-center justify-center">
        {qrSrc ?
        // External QR image endpoint is dynamic; native img keeps print fidelity simple here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrSrc}
          alt={`QR ticket ${ticket?.code || ""}`}
          className="h-[34mm] w-[34mm] object-contain" /> :


        <div className="flex h-[34mm] w-[34mm] items-center justify-center rounded border border-slate-300 text-[10px] text-slate-500">
            QR indisponible
          </div>
        }
      </div>

      <p className="mt-auto break-all text-center text-[13px] font-semibold tracking-[0.03em]">
        {ticket?.code || "-"}
      </p>
      {bookingNumber ?
      <p className="mt-1 text-center text-[10px] text-slate-500">
          {bookingNumber}
        </p> :
      null}
    </article>);

}

function TicketPrintInterface({ booking, onPrint, isLoading, isPrinting }) {
  const tickets = Array.isArray(booking?.tickets) ? booking.tickets : [];

  return (
    <section className="guichet-print-root lg:col-span-8 space-y-5">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
        Vente confirmée. Les billets sont prêts à être imprimés.
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-700">
          {tickets.length} billet{tickets.length > 1 ? "s" : ""} à imprimer
        </p>
        <button
          type="button"
          onClick={onPrint}
          disabled={isLoading || tickets.length === 0 || isPrinting}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-widest transition ${
          isLoading || tickets.length === 0 || isPrinting ?
          "cursor-not-allowed bg-slate-200 text-slate-400" :
          "bg-primary text-white hover:opacity-90"}`
          }>

          <Icon name="ticket" className="h-4 w-4" />
          {isPrinting ? "Impression..." : "Imprimer"}
        </button>
      </div>

      {isLoading ?
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-500">
          Chargement des billets...
        </div> :
      null}

      {!isLoading && tickets.length === 0 ?
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-700">
          Aucun billet trouvé pour ce booking.
        </div> :
      null}

      <div className="ticket-print-grid flex flex-wrap justify-center gap-5">
        {tickets.map((ticket) =>
        <TicketPrintCard
          key={ticket.id || ticket.code}
          ticket={ticket}
          booking={booking} />

        )}
      </div>
    </section>);

}

export default function GuichetCheckoutClient({
  ok,
  message,
  reservation: reservation,
  seats,
  pricingItems,
  pricingOverrides,
  sessionId
}) {
  const router = useRouter();
  const safeSeats = useMemo(() => Array.isArray(seats) ? seats : [], [seats]);
  const safePricingItems = useMemo(
    () => Array.isArray(pricingItems) ? pricingItems : [],
    [pricingItems]
  );
  const pricingItemsList = useMemo(() => {
    const byKey = new Map();

    safePricingItems.forEach((item, index) => {
      const itemKey = String(item?.id ?? item?.name ?? index);
      if (!byKey.has(itemKey)) {
        byKey.set(itemKey, item);
      }
    });

    return Array.from(byKey.entries()).map(([itemKey, item]) => ({
      itemKey,
      item
    }));
  }, [safePricingItems]);
  const overridesList = useMemo(
    () => Array.isArray(pricingOverrides) ? pricingOverrides : [],
    [pricingOverrides]
  );
  const [quantities, setQuantities] = useState({});
  const [submitState, setSubmitState] = useState({
    status: "idle",
    message: "",
    booking: null
  });
  const [subscriptionCodeInput, setSubscriptionCodeInput] = useState("");
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoState, setPromoState] = useState({
    status: "idle",
    message: "",
    promo: null,
    pricing: null
  });
  const promoValidationContextRef = useRef({ subtotal: 0, seatsCount: 0 });
  const printRedirectHandledRef = useRef(false);
  const [printBooking, setPrintBooking] = useState(null);
  const [isLoadingPrintBooking, setIsLoadingPrintBooking] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const bookingForPrint = printBooking || submitState.booking || null;

  const loadBookingForPrint = useCallback(async (bookingId) => {
    if (!bookingId) {
      setPrintBooking(null);
      return;
    }

    setIsLoadingPrintBooking(true);
    try {
      const response = await fetch(`/api/guichet/bookings/${bookingId}`, {
        method: "GET",
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Impossible de charger les billets.");
      }

      setPrintBooking(data?.booking || null);
    } catch (error) {
      setPrintBooking(null);
      setSubmitState((prev) => ({
        status: prev?.status === "success" ? prev.status : "error",
        message:
        prev?.status === "success" ?
        prev.message :
        error?.message || "Impossible de charger les billets.",
        booking: prev?.booking || null
      }));
    } finally {
      setIsLoadingPrintBooking(false);
    }
  }, []);

  const handlePrint = useCallback(async () => {
    if (typeof window === "undefined" || isPrinting) {
      return;
    }

    if (bookingForPrint?.id) {
      try {
        await fetch(`/api/guichet/bookings/${bookingForPrint.id}/print`, {
          method: "POST",
        });
      } catch (_error) {
        // Do not block printing if the audit log request fails.
      }
    }

    printRedirectHandledRef.current = false;
    setIsPrinting(true);
    window.print();
  }, [bookingForPrint?.id, isPrinting]);

  useEffect(() => {
    if (!isPrinting || typeof window === "undefined") {
      return undefined;
    }

    const redirectToGuichet = () => {
      if (printRedirectHandledRef.current) {
        return;
      }

      printRedirectHandledRef.current = true;
      router.replace("/guichet");
    };

    const mediaQuery =
    typeof window.matchMedia === "function" ?
    window.matchMedia("print") :
    null;
    const handleAfterPrint = () => {
      redirectToGuichet();
    };
    const handleMediaChange = (event) => {
      if (!event.matches) {
        redirectToGuichet();
      }
    };

    window.addEventListener("afterprint", handleAfterPrint);
    mediaQuery?.addEventListener?.("change", handleMediaChange);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      mediaQuery?.removeEventListener?.("change", handleMediaChange);
    };
  }, [isPrinting, router]);

  const overrideMap = useMemo(() => {
    const map = new Map();

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
        incoming.price !== null && incoming.price !== undefined ?
        incoming.price :
        existing.price ?? null
      };
    };

    overridesList.forEach((override) => {
      if (!override) {
        return;
      }
      const rowValue = override?.row ?? override?.rowValue ?? override?.seatRow;
      const colValue = override?.col ?? override?.seatCol ?? override?.column;
      if (rowValue === undefined || rowValue === null) {
        return;
      }
      const colNumber = Number(colValue);
      if (!Number.isFinite(colNumber)) {
        return;
      }
      const rawOverride =
      override?.pricingId ??
      override?.pricing ??
      override?.tarif ??
      override?.pricingOverride ??
      override?.pricingOverrideId ??
      override;
      const meta = normalizeOverrideMeta(rawOverride);
      if (!meta) {
        return;
      }
      const key = buildNormalizedSeatKey(rowValue, colNumber);
      const existing = map.get(key);
      map.set(key, mergeOverrideMeta(existing, meta));
    });

    return map;
  }, [overridesList]);

  const getOverrideForSeat = useCallback(
    (seat) => {
      if (!seat) {
        return null;
      }
      const baseOverride = resolveSeatOverride(seat);
      const mapOverride = overrideMap.get(
        buildNormalizedSeatKey(seat.row, seat.col)
      );

      if (!baseOverride && !mapOverride) {
        return null;
      }

      return {
        id: baseOverride?.id || mapOverride?.id || "",
        name: baseOverride?.name || mapOverride?.name || "",
        price: baseOverride?.price ?? mapOverride?.price ?? null
      };
    },
    [overrideMap]
  );

  const fixedSeats = useMemo(
    () =>
    safeSeats.filter((seat) => {
      return Boolean(getOverrideForSeat(seat));
    }),
    [getOverrideForSeat, safeSeats]
  );
  const assignableSeats = Math.max(safeSeats.length - fixedSeats.length, 0);

  const assignedCount = useMemo(
    () =>
    Object.values(quantities).reduce(
      (sum, value) => sum + (Number.isFinite(value) ? value : 0),
      0
    ),
    [quantities]
  );
  const remainingToAssign = Math.max(assignableSeats - assignedCount, 0);
  const isSubmitting = submitState.status === "loading";
  const isSuccess = submitState.status === "success";
  const canAdjust =
  ok &&
  Boolean(reservation) &&
  assignableSeats > 0 &&
  !isSubmitting &&
  !isSuccess;
  const canConfirm =
  ok &&
  Boolean(reservation) &&
  assignedCount === assignableSeats &&
  !isSubmitting &&
  !isSuccess;

  const fixedPricingGroups = useMemo(() => {
    if (!fixedSeats.length) {
      return [];
    }

    const pricingById = new Map();
    pricingItemsList.forEach(({ item }) => {
      if (item?.id !== null && item?.id !== undefined) {
        pricingById.set(String(item.id), item);
      }
    });
    const groups = new Map();

    fixedSeats.forEach((seat) => {
      const overrideMeta = getOverrideForSeat(seat);
      const pricingId = overrideMeta?.id ?
      String(overrideMeta.id) :
      String(seat.pricingOverrideId);
      const pricing = pricingById.get(pricingId);
      const entry = groups.get(pricingId) || {
        pricingId,
        label: overrideMeta?.name || pricing?.name || "Tarif fixe",
        price: overrideMeta?.price ?? pricing?.price,
        seats: []
      };

      entry.seats.push(formatSeatLabel(seat));
      groups.set(pricingId, entry);
    });

    return Array.from(groups.values());
  }, [fixedSeats, getOverrideForSeat, pricingItemsList]);

  const fixedTotal = useMemo(
    () =>
    fixedPricingGroups.reduce(
      (sum, group) => sum + toNumber(group.price) * group.seats.length,
      0
    ),
    [fixedPricingGroups]
  );

  const variableTotal = useMemo(
    () =>
    pricingItemsList.reduce((sum, { itemKey, item }) => {
      const quantity = quantities[itemKey] || 0;
      return sum + quantity * toNumber(item?.price);
    }, 0),
    [pricingItemsList, quantities]
  );

  const totalPrice = fixedTotal + variableTotal;
  const normalizedSubscriptionCode = useMemo(
    () => normalizeSubscriptionCode(subscriptionCodeInput),
    [subscriptionCodeInput]
  );
  const normalizedPromoCode = useMemo(
    () => normalizePromoCode(promoCodeInput),
    [promoCodeInput]
  );
  const isSubscriptionPaymentRequested = Boolean(normalizedSubscriptionCode);
  const canValidatePromo =
  canConfirm &&
  !isSubscriptionPaymentRequested &&
  Boolean(normalizedPromoCode);
  const isPromoApplied =
  promoState.status === "applied" && Boolean(promoState?.promo?.code);
  const appliedPromoCode = isPromoApplied ? String(promoState.promo.code) : "";
  const promoDiscountAmount = isPromoApplied ?
  toNumber(promoState?.pricing?.discountAmount) :
  0;
  const promoReductionLabel = isPromoApplied ?
  promoState?.promo?.reductionType === "percent" ?
  `${toNumber(promoState?.promo?.reductionValue)}%` :
  formatPrice(promoState?.promo?.reductionValue) :
  "";
  const payableTotal = isSubscriptionPaymentRequested ?
  0 :
  Math.max(totalPrice - promoDiscountAmount, 0);

  const handleIncrement = (itemKey) => {
    if (!canAdjust) {
      return;
    }

    setQuantities((prev) => {
      const currentAssigned = Object.values(prev).reduce(
        (sum, value) => sum + (Number.isFinite(value) ? value : 0),
        0
      );
      if (currentAssigned >= assignableSeats) {
        return prev;
      }
      const currentValue = prev[itemKey] || 0;
      return { ...prev, [itemKey]: currentValue + 1 };
    });
  };

  const handleDecrement = (itemKey) => {
    if (!canAdjust) {
      return;
    }

    setQuantities((prev) => {
      const currentValue = prev[itemKey] || 0;
      if (currentValue <= 0) {
        return prev;
      }
      return { ...prev, [itemKey]: currentValue - 1 };
    });
  };

  const handleSubscriptionCodeChange = useCallback(
    (event) => {
      const rawValue = String(event?.target?.value || "");
      const safeValue = rawValue.toUpperCase().replace(/[^A-Z0-9-\s]/g, "");
      setSubscriptionCodeInput(safeValue);
      if (submitState.status === "error") {
        setSubmitState({ status: "idle", message: "", booking: null });
      }
    },
    [submitState.status]
  );

  const handlePromoCodeChange = useCallback(
    (event) => {
      const rawValue = String(event?.target?.value || "");
      const safeValue = rawValue.toUpperCase().replace(/[^A-Z0-9-\s]/g, "");
      setPromoCodeInput(safeValue);
      if (promoState.status !== "idle") {
        setPromoState({
          status: "idle",
          message: "",
          promo: null,
          pricing: null
        });
      }
    },
    [promoState.status]
  );

  const handleCancelPromo = useCallback(() => {
    setPromoCodeInput("");
    setPromoState({ status: "idle", message: "", promo: null, pricing: null });
    promoValidationContextRef.current = { subtotal: 0, seatsCount: 0 };
  }, []);

  const handleValidatePromo = useCallback(async () => {
    if (!canValidatePromo) {
      return;
    }

    setPromoState({
      status: "loading",
      message: "",
      promo: null,
      pricing: null
    });

    try {
      const response = await fetch("/api/guichet/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: normalizedPromoCode,
          subtotalAmount: totalPrice
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Code promo invalide.");
      }

      setPromoState({
        status: "applied",
        message: "Code promo applique.",
        promo: data?.promo || null,
        pricing: data?.pricing || null
      });
      promoValidationContextRef.current = {
        subtotal: totalPrice,
        seatsCount: safeSeats.length
      };
    } catch (error) {
      setPromoState({
        status: "error",
        message: error?.message || "Impossible de valider le code promo.",
        promo: null,
        pricing: null
      });
    }
  }, [canValidatePromo, normalizedPromoCode, safeSeats.length, totalPrice]);

  useEffect(() => {
    if (promoState.status !== "applied") {
      return;
    }

    const context = promoValidationContextRef.current || {};
    const shouldClear =
    isSubscriptionPaymentRequested ||
    remainingToAssign !== 0 ||
    context.subtotal !== totalPrice ||
    context.seatsCount !== safeSeats.length;

    if (!shouldClear) {
      return;
    }

    setPromoState({
      status: "idle",
      message: isSubscriptionPaymentRequested ?
      "Le code promo n'est pas applicable avec un paiement abonnement." :
      "Le panier a change. Merci de revalider le code promo.",
      promo: null,
      pricing: null
    });
  }, [
  isSubscriptionPaymentRequested,
  promoState.status,
  remainingToAssign,
  safeSeats.length,
  totalPrice]
  );

  const handleConfirm = useCallback(async () => {
    if (!canConfirm || !sessionId) {
      return;
    }

    setSubmitState({ status: "loading", message: "", booking: null });
    setPrintBooking(null);
    setIsPrinting(false);

    const selections = pricingItemsList.
    map(({ itemKey, item }) => {
      const quantity = quantities[itemKey] || 0;
      if (!quantity) {
        return null;
      }
      return {
        pricingId: item?.id ?? null,
        name: item?.name,
        price: item?.price,
        quantity
      };
    }).
    filter(Boolean);

    const selectedCount = selections.reduce(
      (sum, selection) => sum + (Number.parseInt(selection?.quantity, 10) || 0),
      0
    );

    if (selectedCount !== assignedCount) {
      setSubmitState({
        status: "error",
        message: "Incohérence des quantités de tarifs. Merci de réessayer.",
        booking: null
      });
      return;
    }

    try {
      const response = await fetch("/api/guichet/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          reservationId: reservation?.reservationId ?? null,
          pricingSelections: selections,
          subscriptionCode: normalizedSubscriptionCode || undefined,
          promoCode: appliedPromoCode || undefined
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Erreur lors de la confirmation.");
      }

      setSubmitState({
        status: "success",
        message: "Vente confirmée.",
        booking: data?.booking || null
      });
      const createdBookingId =
      data?.booking?.id || data?.booking?._id || data?.bookingId || "";
      if (createdBookingId) {
        await loadBookingForPrint(String(createdBookingId));
      }
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error?.message || "Erreur lors de la confirmation.",
        booking: null
      });
    }
  }, [
  appliedPromoCode,
  assignedCount,
  canConfirm,
  normalizedSubscriptionCode,
  pricingItemsList,
  quantities,
  reservation,
  sessionId,
  loadBookingForPrint]
  );

  const shouldShowPrintInterface = submitState.status === "success";
  if (shouldShowPrintInterface) {
    return (
      <>
        <style jsx global>{`
          @media print {
            @page {
              size: 79mm 123mm;
              margin: 0;
            }

            body * {
              visibility: hidden !important;
            }

            .guichet-print-root,
            .guichet-print-root * {
              visibility: visible !important;
            }

            .guichet-print-root {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .guichet-print-root > :not(.ticket-print-grid) {
              display: none !important;
            }

            .ticket-print-grid {
              display: block !important;
            }

            .guichet-ticket-print-sheet {
              width: 79mm !important;
              min-width: 79mm !important;
              max-width: 79mm !important;
              height: 123mm !important;
              min-height: 123mm !important;
              max-height: 123mm !important;
              margin: 0 auto 0 !important;
              border: 0 !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              break-after: page;
              page-break-after: always;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .guichet-ticket-print-sheet:last-child {
              break-after: auto;
              page-break-after: auto;
            }
          }
        `}</style>
        <TicketPrintInterface
          booking={bookingForPrint}
          onPrint={handlePrint}
          isLoading={isLoadingPrintBooking}
          isPrinting={isPrinting} />

      </>);

  }

  return (
    <section className="lg:col-span-8 flex flex-col gap-6">
      {!ok ?
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {message || "Impossible de charger la réservation."}
        </div> :
      null}
      {ok && !reservation ?
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
          Aucune réservation en cours pour cette séance.
        </div> :
      null}
      <div className="flex flex-wrap gap-4">
        <div className="flex min-w-[240px] flex-1 items-center justify-between rounded-2xl p-6 bg-white border border-slate-100 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.2)]">
          <div className="flex flex-col gap-1">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest">
              Restantes à attribuer
            </p>
            <p className="text-primary tracking-tighter text-4xl font-semibold">
              {remainingToAssign}
              <span className="text-lg font-medium text-slate-300 tracking-normal">
                {" "}
                / {safeSeats.length} places
              </span>
            </p>
          </div>
          <div className="bg-primary/10 p-3 rounded-full">
            <Icon name="ticket" className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {pricingItemsList.length ?
        pricingItemsList.map(({ itemKey, item }) => {
          const quantity = quantities[itemKey] || 0;
          const canIncrement = canAdjust && assignedCount < assignableSeats;
          const canDecrement = canAdjust && quantity > 0;

          return (
            <div
              key={itemKey}
              className="flex flex-wrap items-center gap-4 bg-white border border-slate-100 rounded-2xl px-6 min-h-[96px] py-4 justify-between hover:border-primary/20 transition-all shadow-[0_14px_30px_-26px_rgba(15,23,42,0.2)]">

                <div className="flex items-center gap-5">
                  <div className="flex flex-col justify-center">
                    <p className="text-slate-900 text-base font-semibold leading-none mb-1">
                      {item.name}
                    </p>
                    <p className="text-slate-500 text-sm font-medium">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="flex items-center gap-5">
                    <button
                    type="button"
                    disabled={!canDecrement}
                    onClick={() => handleDecrement(itemKey)}
                    className={`h-10 w-10 flex items-center justify-center rounded-full transition-all shadow-md ${
                    canDecrement ?
                    "bg-primary text-white hover:opacity-90" :
                    "bg-slate-200 text-slate-400 cursor-not-allowed"}`
                    }>

                      <Icon name="minus" className="h-4 w-4" />
                    </button>
                    <input
                    className="text-2xl font-semibold w-8 p-0 text-center bg-transparent border-none focus:ring-0 text-slate-900"
                    readOnly
                    type="number"
                    value={quantity} />

                    <button
                    type="button"
                    disabled={!canIncrement}
                    onClick={() => handleIncrement(itemKey)}
                    className={`h-10 w-10 flex items-center justify-center rounded-full transition-all shadow-md ${
                    canIncrement ?
                    "bg-primary text-white hover:opacity-90" :
                    "bg-slate-200 text-slate-400 cursor-not-allowed"}`
                    }>

                      <Icon name="plus" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>);

        }) :

        <div className="rounded-2xl border border-slate-100 bg-white px-6 py-5 text-sm font-semibold text-slate-500">
            Aucun tarif disponible.
          </div>
        }
      </div>

      {fixedPricingGroups.length ?
      <div className="rounded-2xl border border-slate-100 bg-white px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
            Tarifs fixes (imposés)
          </p>
          <div className="space-y-3">
            {fixedPricingGroups.map((group) =>
          <div
            key={group.pricingId}
            className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">
                    {group.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatPrice(group.price)}
                  </span>
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-500">
                  Sièges: {group.seats.join(", ")}
                </div>
              </div>
          )}
          </div>
          <p className="mt-4 text-xs font-semibold text-slate-500">
            Ces sièges ont un tarif fixe et ne peuvent pas être modifiés.
          </p>
        </div> :
      null}

      <div className="rounded-2xl border border-slate-100 bg-white px-6 py-5">
        <label className="mt-3 flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Code abonnement
          </span>
          <input
            value={subscriptionCodeInput}
            onChange={handleSubscriptionCodeChange}
            placeholder="SUB-XXXXXX-XXXXXX"
            disabled={isSubmitting || isSuccess}
            className={`h-11 rounded-xl border px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none ${
            isSubmitting || isSuccess ?
            "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400" :
            "border-slate-200 bg-white focus:border-primary"}`
            } />

        </label>

        {isSubscriptionPaymentRequested ?
        <p className="mt-2 text-xs font-semibold text-emerald-600">
            Mode abonnement actif.
          </p> :
        null}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white px-6 py-5">
        <label className="mt-3 flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Code promo
          </span>
          <input
            value={promoCodeInput}
            onChange={handlePromoCodeChange}
            placeholder="PROMO2026"
            disabled={
            isSubmitting || isSuccess || isSubscriptionPaymentRequested
            }
            className={`h-11 rounded-xl border px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none ${
            isSubmitting || isSuccess || isSubscriptionPaymentRequested ?
            "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400" :
            "border-slate-200 bg-white focus:border-primary"}`
            } />

        </label>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleValidatePromo}
            disabled={!canValidatePromo || promoState.status === "loading"}
            className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-xs font-semibold uppercase tracking-widest transition-all ${
            canValidatePromo && promoState.status !== "loading" ?
            "bg-primary text-white hover:opacity-90" :
            "cursor-not-allowed bg-slate-200 text-slate-400"}`
            }>

            {promoState.status === "loading" ? "Validation..." : "Valider"}
          </button>
          <button
            type="button"
            onClick={handleCancelPromo}
            disabled={isSubmitting || isSuccess}
            className={`inline-flex h-10 items-center justify-center rounded-xl border px-4 text-xs font-semibold uppercase tracking-widest transition-all ${
            isSubmitting || isSuccess ?
            "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400" :
            "border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary"}`
            }>

            Annuler
          </button>
        </div>
        {isPromoApplied ?
        <p className="mt-3 text-xs font-semibold text-emerald-600">
            Code applique: {appliedPromoCode} ({promoReductionLabel}) -
            reduction {formatPrice(promoDiscountAmount)}.
          </p> :
        null}
        {!isPromoApplied && promoState.message ?
        <p
          className={`mt-3 text-xs font-semibold ${
          promoState.status === "error" ? "text-rose-700" : "text-slate-500"}`
          }>

            {promoState.message}
          </p> :
        null}
      </div>

      {submitState.status === "error" ?
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {submitState.message || "Une erreur est survenue."}
        </div> :
      null}

      <div className="mt-4 p-8 bg-white rounded-2xl border-t-4 border-primary shadow-[0_20px_45px_-35px_rgba(15,23,42,0.4)] flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-1">
            Total à payer
          </p>
          <p className="text-slate-900 text-base font-secondary font-semibold">
            {formatPrice(payableTotal)}
          </p>
          {isSubscriptionPaymentRequested ?
          <p className="mt-1 text-xs font-semibold text-slate-400 line-through">
              Montant hors abonnement: {formatPrice(totalPrice)}
            </p> :
          null}
          {!isSubscriptionPaymentRequested && isPromoApplied ?
          <>
              <p className="mt-1 text-xs font-semibold text-slate-400 line-through">
                Montant initial: {formatPrice(totalPrice)}
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">
                Reduction promo: -{formatPrice(promoDiscountAmount)}
              </p>
            </> :
          null}
        </div>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={handleConfirm}
          className={`w-full md:w-auto px-10 py-5 font-semibold text-base rounded-xl transition-all flex items-center justify-center gap-3 ${
          canConfirm ?
          "bg-primary text-white hover:translate-y-[-2px] hover:shadow-lg" :
          "bg-slate-200 text-slate-400 cursor-not-allowed"}`
          }>

          {isSubmitting ? "Confirmation..." : "Confirmer"}
          <Icon name="chevronDown" className="h-4 w-4 -rotate-90" />
        </button>
      </div>
      {submitState.status === "success" ?
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {submitState.message}
          {submitState.booking?.bookingNumber ?
        ` Numéro: ${submitState.booking.bookingNumber}.` :
        ""}
        </div> :
      null}
    </section>);

}
