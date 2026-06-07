import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import {
  formatDate,
  formatDateTime,
  formatPrice,
} from "@/lib/configurations/formatters";
import { getTicketStatusMeta } from "@/lib/configurations/ticket-status";
import { getSalesBookingDetails } from "@/services/sales";

const BOOKING_SOURCE_LABELS = {
  web: "Web",
  mobile: "Web",
  ticket_office: "Guichet",
};

const PAYMENT_METHOD_LABELS = {
  online: "En ligne",
  cash: "Especes",
  card: "Carte",
  subscription: "Abonnement",
};

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

const formatBookingSource = (value) =>
  BOOKING_SOURCE_LABELS[String(value || "").toLowerCase()] || value || "-";

const formatPaymentMethod = (value) =>
  PAYMENT_METHOD_LABELS[String(value || "").toLowerCase()] || value || "-";

const formatIdentityName = (value) => {
  if (!value || typeof value !== "object") {
    return "";
  }

  const firstName = String(value.firstName || "").trim();
  const lastName = String(value.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) {
    return fullName;
  }

  const email = String(value.email || "").trim();
  return email || "";
};

const resolveBookingActor = (booking) => {
  const source = String(booking?.bookingSource || "").toLowerCase();

  if (source === "ticket_office") {
    const guichet = formatIdentityName(booking?.bookedBy);
    return {
      label: "Guichet",
      name: guichet || "-",
      details:
        booking?.bookedBy?.email && booking?.bookedBy?.email !== guichet
          ? booking.bookedBy.email
          : "",
    };
  }

  const customer = formatIdentityName(booking?.customer);
  if (customer) {
    return {
      label: "Client",
      name: customer,
      details:
        booking?.customer?.email && booking?.customer?.email !== customer
          ? booking.customer.email
          : "",
    };
  }

  const guest = formatIdentityName(booking?.customerContact);
  if (guest) {
    return {
      label: "Invite",
      name: guest,
      details: booking?.customerContact?.email || "",
    };
  }

  const fallback = formatIdentityName(booking?.bookedBy);
  return {
    label: "Utilisateur",
    name: fallback || "-",
    details:
      booking?.bookedBy?.email && booking?.bookedBy?.email !== fallback
        ? booking.bookedBy.email
        : "",
  };
};

export default async function TransactionDetailsPage({ params }) {
  const resolvedParams = await params;
  const bookingId = resolvedParams?.bookingId;
  const { booking, error } = await getSalesBookingDetails(bookingId);

  if (!booking) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Link
          href="/ventes/transactions"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary bg-primary text-white shadow-sm transition hover:bg-primary/90"
          aria-label="Retour aux transactions"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
        </Link>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {error || "Impossible de charger le détail du booking."}
        </div>
      </div>
    );
  }

  const tickets = Array.isArray(booking.tickets) ? booking.tickets : [];
  const seats = Array.isArray(booking.seats) ? booking.seats : [];
  const actor = resolveBookingActor(booking);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/ventes/transactions"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary bg-primary text-white shadow-sm transition hover:bg-primary/90"
          aria-label="Retour aux transactions"
        >
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
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
            Paiement
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {formatPaymentMethod(booking.paymentMethod)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Source
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {formatBookingSource(booking.bookingSource)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {formatPrice(booking.totalAmount)}
          </p>
          {booking.promotion?.amountBeforeDiscount && (
            <p className="mt-1 text-xs text-slate-400 line-through">
              {formatPrice(booking.promotion.amountBeforeDiscount)}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Effectue par
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {actor.label} • {actor.name}
          </p>
          {actor.details ? (
            <p className="mt-1 text-xs text-slate-500">{actor.details}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Places
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {seats.length ? seats.map(formatSeatLabel).join(", ") : "-"}
          </p>
        </div>
        {booking.promotion ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600/80">
              Code Promo utilisé
            </p>
            <p className="mt-2 text-sm font-bold text-emerald-700">
              {booking.promotion.code}
            </p>
            <p className="mt-1 text-xs font-semibold text-emerald-600">
              Réduction : -{formatPrice(booking.promotion.discountAmount)}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Promotion
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-400 italic">
              Aucun code promo
            </p>
          </div>
        )}
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
          <span className="text-sm font-semibold text-slate-900">
            {tickets.length}
          </span>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {tickets.length === 0 ? (
                <tr>
                  <td className="px-6 py-8" colSpan={6}>
                    Aucun ticket pour ce booking.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => {
                  const statusMeta = getTicketStatusMeta(ticket);

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
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta.tone}`}
                        >
                          {statusMeta.label}
                        </span>
                        {ticket.scannedAt ? (
                          <div className="mt-1 text-xs text-slate-500">
                            Scanne le {formatDateTime(ticket.scannedAt)}
                          </div>
                        ) : ticket.cancelledAt ? (
                          <div className="mt-1 text-xs text-slate-500">
                            Annule le {formatDateTime(ticket.cancelledAt)}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        {formatDateTime(ticket.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
