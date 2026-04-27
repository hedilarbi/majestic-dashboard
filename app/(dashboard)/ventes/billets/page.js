import DashboardAccessDenied from "@/components/dashboard/access-denied";
import {
  formatDate,
  formatDateTime,
  formatPrice,
} from "@/lib/configurations/formatters";
import { getTicketStatusMeta } from "@/lib/configurations/ticket-status";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import { getSalesTickets } from "@/services/sales";

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

export default async function BilletsPage() {
  const canList = await canAccessDashboardPermission("sales_tickets", "list");

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les billets." />
    );
  }

  const { items, error } = await getSalesTickets({ limit: 200 });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Billets</h1>
        <p className="text-sm text-slate-500">
          Liste des tickets crees apres chaque booking.
        </p>
      </div>

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
