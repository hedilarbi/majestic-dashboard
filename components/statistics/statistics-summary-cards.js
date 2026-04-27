import { formatPrice } from "@/lib/configurations/formatters";

const CARDS = [
  {
    key: "sessionsCount",
    label: "Séances",
    format: (value) => value,
  },
  {
    key: "soldTickets",
    label: "Billets vendus",
    format: (value) => value,
  },
  {
    key: "revenue",
    label: "Recette",
    format: (value) => formatPrice(value),
  },
  {
    key: "bookingsCount",
    label: "Transactions",
    format: (value) => value,
  },
];

export default function StatisticsSummaryCards({ totals }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {CARDS.map((card) => (
        <div
          key={card.key}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {card.label}
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {card.format(totals?.[card.key] || 0)}
          </p>
        </div>
      ))}
    </div>
  );
}
