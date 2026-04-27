import { formatDate, formatPrice } from "@/lib/configurations/formatters";

const formatSessionLabel = (row) => {
  const dateLabel = formatDate(row?.date);
  const timeLabel = row?.sessionTime || "";
  return `${dateLabel}${timeLabel ? ` • ${timeLabel}` : ""}`;
};

export default function SessionStatsTable({ rows = [] }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-900">
          Vente par séance
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Toutes les séances correspondant aux filtres appliqués.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Événement</th>
              <th className="px-6 py-4 text-left font-semibold">Séance</th>
              <th className="px-6 py-4 text-left font-semibold">Billets restants</th>
              <th className="px-6 py-4 text-left font-semibold">Billets vendus</th>
              <th className="px-6 py-4 text-left font-semibold">Recette</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-600">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8">
                  Aucune séance pour ces filtres.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.sessionId} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {row.eventName || "-"}
                  </td>
                  <td className="px-6 py-4">{formatSessionLabel(row)}</td>
                  <td className="px-6 py-4">{row.remainingTickets || 0}</td>
                  <td className="px-6 py-4">{row.soldTickets || 0}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {formatPrice(row.revenue || 0)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
