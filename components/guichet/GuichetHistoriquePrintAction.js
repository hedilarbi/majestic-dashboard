"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { RiPrinterLine } from "react-icons/ri";

const formatPrice = (value) => {
  const amount = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(amount)) return "-";
  return `${amount.toFixed(2).replace(".", ",")} DT`;
};

const formatSessionDateTime = (date, time) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date).slice(0, 10);
  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
  return time ? `${formattedDate} - ${time}` : formattedDate;
};

const buildQrSrc = (ticket) => {
  const value = ticket?.qrCodeUrl || ticket?.code || "";
  if (!value) return "";
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value)}`;
};

function TicketCard({ ticket, booking }) {
  const session = booking?.session || {};
  const eventName = session?.event?.name || "Le Majestic";
  const sessionDateTime = formatSessionDateTime(session?.date, session?.sessionTime);
  const qrSrc = buildQrSrc(ticket);

  return (
    <article className="guichet-ticket-print-sheet relative mx-auto flex h-[123mm] min-h-[123mm] w-[79mm] min-w-[79mm] max-w-[79mm] flex-col rounded-md border border-slate-300 bg-white px-4 py-4 text-center text-black shadow-sm">
      <div className="mx-auto mb-3 flex h-16 items-center justify-center">
        <Image
          src="/images/logo.png"
          alt="Le Majestic"
          width={260}
          height={82}
          className="h-full w-auto object-contain"
          priority={false}
        />
      </div>
      <p className="px-1 text-center text-[18px] font-black leading-tight">{eventName}</p>
      <p className="mt-2 text-center text-[14px] font-semibold">{sessionDateTime}</p>
      <p className="mt-2 text-center text-[14px] font-semibold">
        {ticket?.pricingName || "Tarif"} : {formatPrice(ticket?.price)}
      </p>
      <div className="mt-5 flex items-center justify-center">
        {qrSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrSrc} alt={`QR ${ticket?.code || ""}`} className="h-[34mm] w-[34mm] object-contain" />
        ) : (
          <div className="flex h-[34mm] w-[34mm] items-center justify-center rounded border border-slate-300 text-[10px] text-slate-500">
            QR indisponible
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-[16px] font-black uppercase tracking-tight">
        Siège : {ticket?.seat?.row}{ticket?.seat?.col}
      </p>
      <p className="mt-auto break-all text-center text-[13px] font-semibold tracking-[0.03em]">
        {ticket?.code || "-"}
      </p>
      {booking?.bookingNumber ? (
        <p className="mt-1 text-center text-[10px] text-slate-500">{booking.bookingNumber}</p>
      ) : null}
    </article>
  );
}

export default function GuichetHistoriquePrintAction({ bookingId, printCount = 0 }) {
  const [localPrintCount, setLocalPrintCount] = useState(printCount);
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const printFallbackRef = useRef(null);

  const handlePrint = useCallback(async () => {
    if (isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`/api/guichet/bookings/${bookingId}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Impossible de charger les billets.");
        setIsLoading(false);
        return;
      }

      const loadedBooking = data?.booking || null;
      setBooking(loadedBooking);

      // Increment print counter (non-blocking)
      fetch(`/api/guichet/bookings/${bookingId}/print`, { method: "POST" })
        .then(() => setLocalPrintCount((c) => c + 1))
        .catch(() => {});

      // Small delay to let React render the ticket cards before opening the dialog
      setTimeout(() => {
        setIsLoading(false);

        const fallback = setTimeout(() => setBooking(null), 30_000);
        printFallbackRef.current = fallback;

        const handleAfterPrint = () => {
          clearTimeout(printFallbackRef.current);
          window.removeEventListener("afterprint", handleAfterPrint);
          setBooking(null);
        };
        window.addEventListener("afterprint", handleAfterPrint);

        window.print();
      }, 120);
    } catch {
      setError("Erreur lors du chargement des billets.");
      setIsLoading(false);
    }
  }, [bookingId, isLoading]);

  const tickets = Array.isArray(booking?.tickets) ? booking.tickets : [];

  return (
    <>
      {/* Hidden print view — visible only during @media print */}
      {booking ? (
        <div className="guichet-print-root hidden">
          <div className="ticket-print-grid">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id || ticket.code} ticket={ticket} booking={booking} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={handlePrint}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
          title="Imprimer les billets"
        >
          <RiPrinterLine className="h-4 w-4" />
          {isLoading ? "Chargement..." : "Imprimer"}
        </button>
        {localPrintCount > 0 ? (
          <span className="text-[10px] font-semibold text-slate-400">
            Imprimé {localPrintCount}×
          </span>
        ) : null}
        {error ? (
          <span className="text-[10px] font-semibold text-red-500">{error}</span>
        ) : null}
      </div>
    </>
  );
}
