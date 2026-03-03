import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { formatDate, formatDateTime, formatPrice } from "@/lib/configurations/formatters";
import { getGuichetHistory } from "@/services/guichet-history";

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

  const eventName = session.event?.name || "Seance";
  const dateLabel = formatSessionDateOnly(session.date);
  const timeLabel = session.sessionTime || "";

  return `${eventName} • ${dateLabel}${timeLabel ? ` ${timeLabel}` : ""}`;
};

export default async function GuichetHistoriquePage() {
  const { items, error } = await getGuichetHistory({ limit: 200 });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Historique</h1>
        <p className="text-sm text-slate-500">
          Ventes realisees par ce guichet.
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
                <th className="px-6 py-4 text-left font-semibold">Booking</th>
                <th className="px-6 py-4 text-left font-semibold">Seance</th>
                <th className="px-6 py-4 text-left font-semibold">Places</th>
                <th className="px-6 py-4 text-left font-semibold">Total</th>
                <th className="px-6 py-4 text-left font-semibold">Date</th>
                <th className="px-6 py-4 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {items.length === 0 ? (
                <tr>
                  <td className="px-6 py-8" colSpan={6}>
                    Aucune vente pour le moment.
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
                      {booking.seatsCount || 0}
                    </td>
                    <td className="px-6 py-4">
                      {formatPrice(booking.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      {formatDateTime(booking.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {booking.id ? (
                        <Link
                          href={`/guichet/historique/${booking.id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-primary"
                          aria-label="Voir le detail du booking"
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
