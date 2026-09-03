import { formatDate, formatPrice } from "@/lib/configurations/formatters";

const formatSessionLabel = (row) => {
  const dateLabel = formatDate(row?.date);
  const timeLabel = row?.sessionTime || "";
  return `${dateLabel}${timeLabel ? ` • ${timeLabel}` : ""}`;
};

export default function SessionStatsTable({ rows = [], pricingColumns = [] }) {
  const totalColumns = 6 + pricingColumns.length;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-900">
          Vente par séance
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Toutes les séances correspondant aux filtres appliqués, avec détail par tarif et abonnement.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Événement</th>
              <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Séance</th>
              <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Billets restants</th>
              <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">Billets vendus</th>
              {pricingColumns.map((col) => (
                <th key={col.key} className="px-6 py-4 text-center font-semibold whitespace-nowrap">
                  <div>{col.pricingName || col.label}</div>
                  <div className="text-[11px] font-normal text-slate-400">
                    {formatPrice(col.price || 0)}
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 text-center font-semibold whitespace-nowrap">
                <div>Abonnements</div>
                <div className="text-[11px] font-normal text-slate-400">Billets • Recette</div>
              </th>
              <th className="px-6 py-4 text-right font-semibold whitespace-nowrap">Promotion</th>
              <th className="px-6 py-4 text-right font-semibold whitespace-nowrap">Recette totale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-600">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={totalColumns} className="px-6 py-8 text-center">
                  Aucune séance pour ces filtres.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.sessionId} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                    {row.eventName || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatSessionLabel(row)}</td>
                  <td className="px-6 py-4">{row.remainingTickets || 0}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {row.soldTickets || 0}
                  </td>
                  {pricingColumns.map((col) => {
                    const count = row.pricingCounts?.[col.key] || 0;
                    return (
                      <td key={col.key} className="px-6 py-4 text-center text-slate-700">
                        {count > 0 ? count : "-"}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    {row.subscriptionTickets > 0 || row.subscriptionRevenue > 0 ? (
                      <div>
                        <span className="font-medium text-slate-800">
                          {row.subscriptionTickets || 0} billet(s)
                        </span>
                        <span className="ml-1.5 text-xs text-slate-500">
                          ({formatPrice(row.subscriptionRevenue || 0)})
                        </span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap text-slate-600">
                    {row.promotionDiscountAmount > 0
                      ? formatPrice(row.promotionDiscountAmount)
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 whitespace-nowrap">
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
