import DashboardAccessDenied from "@/components/dashboard/access-denied";
import ExportButtons from "@/components/dashboard/export-buttons";
import {
  formatDate,
  formatDateTime,
  formatPrice,
} from "@/lib/configurations/formatters";
import { getTicketStatusMeta } from "@/lib/configurations/ticket-status";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import { getSalesTickets } from "@/services/sales";

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

const formatSeat = (seat) => {
  if (!seat) {
    return "-";
  }
  return `${seat.row}${seat.col}`;
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

export default async function BilletsPage({ searchParams }) {
  const canList = await canAccessDashboardPermission("sales_tickets", "list");

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les billets." />
    );
  }

  const resolvedParams = await searchParams;
  const filters = {
    dateFrom: parseSearchParam(resolvedParams?.dateFrom),
    dateTo: parseSearchParam(resolvedParams?.dateTo),
    status: parseSearchParam(resolvedParams?.status),
    pricingName: parseSearchParam(resolvedParams?.pricingName),
  };
  const exportQueryString = buildQueryString(filters);
  const { items, error } = await getSalesTickets({ limit: 200, ...filters });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">Billets</h1>
          <p className="text-sm text-slate-500">
            Liste des tickets crees apres chaque booking.
          </p>
        </div>
        <ExportButtons resource="billets" queryString={exportQueryString} />
      </div>

      <form
        method="GET"
        className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-5"
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
          name="status"
          defaultValue={filters.status}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="scanned">Scanné</option>
          <option value="cancelled">Annulé</option>
        </select>
        <input
          type="search"
          name="pricingName"
          defaultValue={filters.pricingName}
          placeholder="Tarif"
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          Filtrer
        </button>
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
                <th className="px-6 py-4 text-left font-semibold">Code</th>
                <th className="px-6 py-4 text-left font-semibold">Séance</th>
                <th className="px-6 py-4 text-left font-semibold">Siège</th>
                <th className="px-6 py-4 text-left font-semibold">Tarif</th>
                <th className="px-6 py-4 text-left font-semibold">Prix</th>
                <th className="px-6 py-4 text-left font-semibold">Statut</th>
                <th className="px-6 py-4 text-left font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {items.length === 0 ? (
                <tr>
                  <td className="px-6 py-8" colSpan={7}>
                    Aucun billet pour le moment.
                  </td>
                </tr>
              ) : (
                items.map((ticket) => {
                  const statusMeta = getTicketStatusMeta(ticket);

                  return (
                    <tr key={ticket.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {ticket.code || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {formatSessionLabel(ticket.session)}
                      </td>
                      <td className="px-6 py-4">{formatSeat(ticket.seat)}</td>
                      <td className="px-6 py-4">{ticket.pricingName}</td>
                      <td className="px-6 py-4">{formatPrice(ticket.price)}</td>
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
