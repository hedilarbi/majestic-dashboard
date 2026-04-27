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

  const eventName = session.event?.name || "Séance";
  const dateLabel = formatSessionDateOnly(session.date);
  const timeLabel = session.sessionTime || "";

  return `${eventName} • ${dateLabel}${timeLabel ? ` ${timeLabel}` : ""}`;
};

const formatSessionMeta = (subtitle) => {
  if (!subtitle) {
    return "-";
  }

  const dateLabel = formatSessionDateOnly(subtitle.date);
  const timeLabel = subtitle.sessionTime || "";

  return `${dateLabel}${timeLabel ? ` ${timeLabel}` : ""}`;
};

const HISTORY_TYPE_OPTIONS = [
  { value: "all", label: "Tout" },
  { value: "ticket", label: "Billets" },
  { value: "subscription", label: "Abonnements" },
];

const toDateInputValue = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (segment) => String(segment).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
};

export default async function GuichetHistoriquePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const today = toDateInputValue(new Date());
  const appliedDateFrom =
    typeof resolvedSearchParams?.dateFrom === "string" &&
    resolvedSearchParams.dateFrom.trim()
      ? resolvedSearchParams.dateFrom
      : today;
  const appliedDateTo =
    typeof resolvedSearchParams?.dateTo === "string" &&
    resolvedSearchParams.dateTo.trim()
      ? resolvedSearchParams.dateTo
      : today;
  const appliedType =
    typeof resolvedSearchParams?.type === "string" &&
    HISTORY_TYPE_OPTIONS.some((option) => option.value === resolvedSearchParams.type)
      ? resolvedSearchParams.type
      : "all";
  const isTodaySelected =
    appliedDateFrom === today && appliedDateTo === today;

  const { items, error } = await getGuichetHistory({
    limit: 200,
    dateFrom: appliedDateFrom,
    dateTo: appliedDateTo,
    type: appliedType,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">Historique</h1>
          <p className="text-sm text-slate-500">
            Ventes realisees par ce guichet.
          </p>
        </div>

        <form className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
          <div className="flex items-center gap-2">
            <Link
              href={
                appliedType === "all"
                  ? "/guichet/historique"
                  : `/guichet/historique?type=${encodeURIComponent(appliedType)}`
              }
              className={`inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition ${
                isTodaySelected
                  ? "border-primary bg-primary text-white hover:bg-primary/90"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Aujourd&apos;hui
            </Link>
          </div>
          <label className="flex min-w-[180px] flex-col gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-700">Type</span>
            <select
              name="type"
              defaultValue={appliedType}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {HISTORY_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-[180px] flex-col gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-700">De</span>
            <input
              type="date"
              name="dateFrom"
              defaultValue={appliedDateFrom}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="flex min-w-[180px] flex-col gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-700">A</span>
            <input
              type="date"
              name="dateTo"
              defaultValue={appliedDateTo}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Filtrer
            </button>
          </div>
        </form>
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
                <th className="px-6 py-4 text-left font-semibold">Type</th>
                <th className="px-6 py-4 text-left font-semibold">Reference</th>
                <th className="px-6 py-4 text-left font-semibold">Libelle</th>
                <th className="px-6 py-4 text-left font-semibold">Quantite</th>
                <th className="px-6 py-4 text-left font-semibold">Total</th>
                <th className="px-6 py-4 text-left font-semibold">Date</th>
                <th className="px-6 py-4 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {items.length === 0 ? (
                <tr>
                  <td className="px-6 py-8" colSpan={7}>
                    Aucune vente pour le moment.
                  </td>
                </tr>
              ) : (
                items.map((booking) => (
                  <tr key={`${booking.type}:${booking.id}`} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          booking.type === "subscription"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-blue-200 bg-blue-50 text-blue-700"
                        }`}
                      >
                        {booking.type === "subscription" ? "Abonnement" : "Billet"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {booking.reference || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{booking.title}</div>
                      {booking.subtitle ? (
                        <div className="text-xs text-slate-500">
                          {formatSessionMeta(booking.subtitle)}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      {booking.quantityLabel || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {formatPrice(booking.totalAmount || 0)}
                    </td>
                    <td className="px-6 py-4">
                      {formatDateTime(booking.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {booking.actionHref ? (
                        <Link
                          href={booking.actionHref}
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
