import DashboardAccessDenied from "@/components/dashboard/access-denied";
import Link from "next/link";

import ExportButtons from "@/components/dashboard/export-buttons";
import { Icon } from "@/components/ui/icons";
import { formatDate, formatDateTime, formatPrice } from "@/lib/configurations/formatters";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import { getSalesTransactions } from "@/services/sales";

const parseSearchParam = (value) => {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return typeof value === "string" ? value : "";
};

const buildQueryString = (filters) => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });
  return query.toString();
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

const formatIdentity = (value) => {
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

const formatBookingActor = (booking) => {
  const source = String(booking?.bookingSource || "").toLowerCase();

  if (source === "ticket_office") {
    const guichet = formatIdentity(booking?.bookedBy);
    return guichet ? `Guichet • ${guichet}` : "Guichet";
  }

  const customer = formatIdentity(booking?.customer);
  if (customer) {
    return customer;
  }

  const guest = formatIdentity(booking?.customerContact);
  if (guest) {
    return `Invite • ${guest}`;
  }

  return "-";
};

export default async function TransactionsPage({ searchParams }) {
  const canList = await canAccessDashboardPermission(
    "sales_transactions",
    "list",
  );

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les transactions." />
    );
  }

  const resolvedParams = await searchParams;
  const filters = {
    dateFrom: parseSearchParam(resolvedParams?.dateFrom),
    dateTo: parseSearchParam(resolvedParams?.dateTo),
    paymentMethod: parseSearchParam(resolvedParams?.paymentMethod),
    paymentStatus: parseSearchParam(resolvedParams?.paymentStatus),
    bookingSource: parseSearchParam(resolvedParams?.bookingSource),
    status: parseSearchParam(resolvedParams?.status),
  };
  const exportQueryString = buildQueryString(filters);
  const { items, error } = await getSalesTransactions({ limit: 200, ...filters });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">Transactions</h1>
          <p className="text-sm text-slate-500">
            Derniers bookings enregistrés dans le système.
          </p>
        </div>
        <ExportButtons resource="transactions" queryString={exportQueryString} />
      </div>

      <form
        method="GET"
        className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3 lg:grid-cols-6"
      >
        <input
          type="date"
          name="dateFrom"
          defaultValue={filters.dateFrom}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Date début"
        />
        <input
          type="date"
          name="dateTo"
          defaultValue={filters.dateTo}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Date fin"
        />
        <select
          name="paymentMethod"
          defaultValue={filters.paymentMethod}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Paiement</option>
          <option value="online">En ligne</option>
          <option value="cash">Espèces</option>
          <option value="card">Carte</option>
          <option value="subscription">Abonnement</option>
        </select>
        <select
          name="paymentStatus"
          defaultValue={filters.paymentStatus}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Statut paiement</option>
          <option value="pending">En attente</option>
          <option value="completed">Payé</option>
          <option value="failed">Échoué</option>
          <option value="refunded">Remboursé</option>
        </select>
        <select
          name="bookingSource"
          defaultValue={filters.bookingSource}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Source</option>
          <option value="web">Web</option>
          <option value="mobile">Mobile</option>
          <option value="ticket_office">Guichet</option>
        </select>
        <div className="flex gap-2">
          <select
            name="status"
            defaultValue={filters.status}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Statut</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmé</option>
            <option value="cancelled">Annulé</option>
            <option value="used">Utilisé</option>
            <option value="refunded">Remboursé</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Filtrer
          </button>
        </div>
      </form>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Booking</th>
                <th className="px-6 py-4 text-left font-semibold">Séance</th>
                <th className="px-6 py-4 text-left font-semibold">
                  Effectue par
                </th>
                <th className="px-6 py-4 text-left font-semibold">Total</th>
                <th className="px-6 py-4 text-left font-semibold">Paiement</th>
                <th className="px-6 py-4 text-left font-semibold">Date</th>
                <th className="px-6 py-4 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {items.length === 0 ? (
                <tr>
                  <td className="px-6 py-8" colSpan={7}>
                    Aucune transaction pour le moment.
                  </td>
                </tr>
              ) : (
                items.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {booking.bookingNumber || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {formatSessionLabel(booking.session)}
                    </td>
                    <td className="px-6 py-4">
                      {formatBookingActor(booking)}
                    </td>
                    <td className="px-6 py-4">
                      {formatPrice(booking.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-800 capitalize">
                        {booking.paymentMethod || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {formatDateTime(booking.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {booking.id ? (
                        <Link
                          href={`/ventes/transactions/${booking.id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-primary"
                          aria-label="Voir le détail du booking"
                          title="Voir le detail"
                        >
                          <Icon name="eye" className="h-4 w-4" />
                        </Link>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
