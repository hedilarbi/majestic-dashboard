import Link from "next/link";

import GuichetBookingCancelAction from "@/components/guichet/GuichetBookingCancelAction";
import { GuichetTicketPrintAction } from "@/components/guichet/GuichetHistoriquePrintAction";
import { Icon } from "@/components/ui/icons";
import {
  formatDate,
  formatDateTime,
  formatPrice } from
"@/lib/configurations/formatters";
import { getTicketStatusMeta } from "@/lib/configurations/ticket-status";
import { getGuichetBookingDetails } from "@/services/guichet-booking-details";

const formatSessionDateOnly = (value) => {
  if (!value) {
    return "-";
  }

  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
  }

  return formatDate(value);
};

const formatSessionLabel = (session) => {
  if (!session) {
    return "-";
  }

  const eventName = session.event?.name || "Séance";
  const dateLabel = formatSessionDateOnly(session.date);
  const timeLabel = session.sessionTime || "";

  return `${eventName} • ${dateLabel}${timeLabel ? ` ${timeLabel}` : ""}`;
};

const formatSeatLabel = (seat) => {
  if (!seat) {
    return "-";
  }
  return `${seat.row}${seat.col}`;
};

const HISTORY_FILTER_KEYS = ["type", "dateFrom", "dateTo"];
const TUNIS_TIME_ZONE = "Africa/Tunis";

const buildHistoryBackHref = (searchParams) => {
  const query = new URLSearchParams();

  HISTORY_FILTER_KEYS.forEach((key) => {
    const value = searchParams?.[key];
    if (typeof value === "string" && value.trim()) {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `/guichet/historique?${queryString}` : "/guichet/historique";
};

const getTunisDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TUNIS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const segments = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${segments.year}-${segments.month}-${segments.day}`;
};

const isSoldToday = (ticket, todayKey) => getTunisDateKey(ticket?.createdAt) === todayKey;

export default async function GuichetBookingDetailsPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const bookingId = resolvedParams?.bookingId;
  const backHref = buildHistoryBackHref(resolvedSearchParams);

  const { ok, booking, message } = await getGuichetBookingDetails(bookingId);

  if (!ok || !booking) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          href={backHref}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary bg-primary text-white shadow-sm transition hover:bg-primary/90"
          aria-label="Retour a l'historique">

          <Icon name="chevronLeft" className="h-4 w-4" />
        </Link>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {message || "Impossible de charger le détail du booking."}
        </div>
      </div>);

  }

  const tickets = Array.isArray(booking.tickets) ? booking.tickets : [];
  const seats = Array.isArray(booking.seats) ? booking.seats : [];
  const cancellableTickets = tickets.filter((ticket) => {
    const statusMeta = getTicketStatusMeta(ticket);
    return statusMeta.code === "not_scanned";
  });
  const nonCancelledTickets = tickets.filter((ticket) => {
    const statusMeta = getTicketStatusMeta(ticket);
    return statusMeta.code !== "cancelled";
  });
  const todayKey = getTunisDateKey(new Date());
  const canCancelEntireSale =
  cancellableTickets.length > 0 &&
  cancellableTickets.length === nonCancelledTickets.length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href={backHref}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary bg-primary text-white shadow-sm transition hover:bg-primary/90"
          aria-label="Retour a l'historique">

          <Icon name="chevronLeft" className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900">
            Detail booking
          </h1>
          <p className="text-sm text-slate-500">
            {booking.bookingNumber || booking.id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Séance
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {formatSessionLabel(booking.session)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {formatPrice(booking.totalAmount)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Places
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {seats.length ? seats.map(formatSeatLabel).join(", ") : "-"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Date de création
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {formatDateTime(booking.createdAt)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
            Tickets
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-900">
              {tickets.length}
            </span>
            {canCancelEntireSale ?
            <GuichetBookingCancelAction
              bookingId={booking.id}
              ticketIds={cancellableTickets.map((ticket) => ticket.id)}
              label="Annuler toute la vente"
              description="Cette action annule tous les billets non scannés de cette vente."
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60" /> :

            null}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Code</th>
                <th className="px-6 py-4 text-left font-semibold">Siège</th>
                <th className="px-6 py-4 text-left font-semibold">Tarif</th>
                <th className="px-6 py-4 text-left font-semibold">Prix</th>
                <th className="px-6 py-4 text-left font-semibold">Statut</th>
                <th className="px-6 py-4 text-left font-semibold">
                  Date ticket
                </th>
                <th className="px-6 py-4 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {tickets.length === 0 ?
              <tr>
                  <td className="px-6 py-8" colSpan={7}>
                    Aucun ticket pour ce booking.
                  </td>
                </tr> :

              tickets.map((ticket) => {
                const statusMeta = getTicketStatusMeta(ticket);
                const ticketSoldToday = isSoldToday(ticket, todayKey);
                const canPrintTicket =
                  ticketSoldToday && statusMeta.code !== "cancelled";
                const printDisabledReason =
                  statusMeta.code === "cancelled"
                    ? "Billet annulé"
                    : ticketSoldToday
                      ? ""
                      : "Vente hors aujourd'hui";

                return (
                  <tr key={ticket.id || ticket.code} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {ticket.code || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {formatSeatLabel(ticket.seat)}
                      </td>
                      <td className="px-6 py-4">
                        {ticket.pricingName || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {formatPrice(ticket.price)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.tone}`}>

                          {statusMeta.label}
                        </span>
                        {ticket.scannedAt ?
                      <div className="mt-1 text-xs text-slate-500">
                            Scanne le {formatDateTime(ticket.scannedAt)}
                          </div> :
                      ticket.cancelledAt ?
                      <div className="mt-1 text-xs text-slate-500">
                            Annule le {formatDateTime(ticket.cancelledAt)}
                          </div> :
                      null}
                      </td>
                      <td className="px-6 py-4">
                        {formatDateTime(ticket.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-start gap-2">
                          <GuichetTicketPrintAction
                            booking={booking}
                            ticket={ticket}
                            canPrint={canPrintTicket}
                            disabledReason={printDisabledReason}
                          />
                          {statusMeta.code === "not_scanned" ?
                        <GuichetBookingCancelAction
                          bookingId={booking.id}
                          ticketIds={[ticket.id]}
                          label="Annuler"
                          description={`Cette action annule le billet ${ticket.code || ""} (${formatSeatLabel(ticket.seat)}).`}
                          className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60" /> :


                        null
                        }
                        </div>
                      </td>
                    </tr>);

              })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}
