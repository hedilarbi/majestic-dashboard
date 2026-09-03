import DashboardAccessDenied from "@/components/dashboard/access-denied";
import SessionStatsTable from "@/components/statistics/session-stats-table";
import StatisticsBarChart from "@/components/statistics/statistics-bar-chart";
import StatisticsFilters from "@/components/statistics/statistics-filters";
import StatisticsSummaryCards from "@/components/statistics/statistics-summary-cards";
import { formatPrice } from "@/lib/configurations/formatters";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import { getEvents } from "@/services/evenements";
import { getStatistics } from "@/services/statistics";

const parseSearchParam = (value) => {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return typeof value === "string" ? value : "";
};

const VIEW_OPTIONS = [
  { value: "sessions", label: "Vente par séance" },
  { value: "sessionTimes", label: "Heure de séance" },
  { value: "pricing", label: "Tarifs" },
  { value: "saleDays", label: "Jours de vente" },
  { value: "leadTimes", label: "Delai avant séance" },
  { value: "saleHours", label: "Heures de vente" },
  { value: "platforms", label: "Plateformes de vente" },
  { value: "subscriptionUsage", label: "Paiement abonnement" },
  { value: "promoUsage", label: "Code promo" },
];

const buildChartItems = (items = [], valueKey, metaBuilder) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    label: item?.label || "-",
    value: Number(item?.[valueKey]) || 0,
    meta: typeof metaBuilder === "function" ? metaBuilder(item) : "",
  }));

const buildSelectedView = (statistics, selectedView) => {
  const charts = statistics?.charts || {};

  switch (selectedView) {
    case "sessionTimes":
      return {
        type: "chart",
        title: "Statistiques par heure de séance",
        description: "Billets vendus et recette par horaire de séance.",
        valueLabel: "billets",
        items: buildChartItems(
          charts.sessionTimes,
          "ticketsSold",
          (item) => `${item.sessionCount} séance(s) • ${formatPrice(item.revenue)}`,
        ),
      };
    case "pricing":
      return {
        type: "chart",
        title: "Statistiques par tarif",
        description: "Nombre de billets vendus par tarif.",
        valueLabel: "billets",
        items: buildChartItems(
          charts.pricing,
          "ticketsSold",
          (item) => formatPrice(item.revenue),
        ),
      };
    case "saleDays":
      return {
        type: "chart",
        title: "Jours de vente",
        description: "Quand les transactions sont enregistrées.",
        valueLabel: "billets",
        items: buildChartItems(
          charts.saleDays,
          "ticketsSold",
          (item) =>
            `${item.bookingCount} transaction(s) • ${formatPrice(item.revenue)}`,
        ),
      };
    case "leadTimes":
      return {
        type: "chart",
        title: "Quand les billets s'achetent par rapport a la séance",
        description: "Jour J, veille, deux jours avant, etc.",
        valueLabel: "billets",
        items: buildChartItems(
          charts.leadTimes,
          "ticketsSold",
          (item) =>
            `${item.bookingCount} transaction(s) • ${formatPrice(item.revenue)}`,
        ),
      };
    case "saleHours":
      return {
        type: "chart",
        title: "Heures de vente",
        description: "A quelles heures les ventes sont effectuees.",
        valueLabel: "billets",
        items: buildChartItems(
          charts.saleHours,
          "ticketsSold",
          (item) =>
            `${item.bookingCount} transaction(s) • ${formatPrice(item.revenue)}`,
        ),
      };
    case "platforms":
      return {
        type: "chart",
        title: "Plateformes de vente",
        description: "Guichet ou web.",
        valueLabel: "billets",
        items: buildChartItems(
          charts.platforms,
          "ticketsSold",
          (item) =>
            `${item.bookingCount} transaction(s) • ${formatPrice(item.revenue)}`,
        ),
      };
    case "subscriptionUsage":
      return {
        type: "chart",
        title: "Paiement par abonnement",
        description: "Part des ventes reglees avec abonnement.",
        valueLabel: "billets",
        items: buildChartItems(
          charts.subscriptionUsage,
          "ticketsSold",
          (item) =>
            `${item.bookingCount} transaction(s) • ${formatPrice(item.revenue)}`,
        ),
      };
    case "promoUsage":
      return {
        type: "chart",
        title: "Utilisation de code promo",
        description: "Part des ventes avec ou sans code promo.",
        valueLabel: "transactions",
        items: buildChartItems(
          charts.promoUsage,
          "bookingCount",
          (item) =>
            `${item.ticketsSold} billets • remise ${formatPrice(item.discountAmount || 0)}`,
        ),
      };
    case "sessions":
    default:
      return {
        type: "table",
      };
  }
};

export default async function StatisticsPage({ searchParams }) {
  const canList = await canAccessDashboardPermission("statistics", "list");

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les statistiques." />
    );
  }

  const resolvedSearchParams = await searchParams;
  const filters = {
    dateStart: parseSearchParam(resolvedSearchParams?.dateStart),
    dateEnd: parseSearchParam(resolvedSearchParams?.dateEnd),
    eventId: parseSearchParam(resolvedSearchParams?.eventId),
    sessionTime: parseSearchParam(resolvedSearchParams?.sessionTime),
  };
  const selectedView = VIEW_OPTIONS.some(
    (option) => option.value === parseSearchParam(resolvedSearchParams?.view),
  )
    ? parseSearchParam(resolvedSearchParams?.view)
    : "sessions";

  const [{ ok, data, message }, eventsResult] = await Promise.all([
    getStatistics(filters),
    getEvents({ page: 1, limit: 500 }),
  ]);
  const exportQuery = new URLSearchParams();
  if (filters.dateStart) {
    exportQuery.set("dateStart", filters.dateStart);
  }
  if (filters.dateEnd) {
    exportQuery.set("dateEnd", filters.dateEnd);
  }
  if (filters.eventId) {
    exportQuery.set("eventId", filters.eventId);
  }
  if (filters.sessionTime) {
    exportQuery.set("sessionTime", filters.sessionTime);
  }
  if (selectedView) {
    exportQuery.set("view", selectedView);
  }
  const exportHref = `/api/statistiques/seances/pdf${exportQuery.toString() ? `?${exportQuery.toString()}` : ""
    }`;

  const events = Array.isArray(eventsResult?.items) ? eventsResult.items : [];
  const statistics = data || {
    filters: {
      dateStart: filters.dateStart,
      dateEnd: filters.dateEnd,
      eventId: filters.eventId,
      sessionTime: filters.sessionTime,
    },
    availableSessionTimes: [],
    totals: {
      sessionsCount: 0,
      soldTickets: 0,
      remainingTickets: 0,
      revenue: 0,
      bookingsCount: 0,
    },
    sessionRows: [],
    charts: {
      sessionTimes: [],
      pricing: [],
      saleDays: [],
      leadTimes: [],
      saleHours: [],
      platforms: [],
      subscriptionUsage: [],
      promoUsage: [],
    },
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Statistiques
          </h1>
          <p className="text-sm text-slate-500">
            Analyse des ventes, des séances et des comportements d&apos;achat.
          </p>
        </div>

        <a
          href={exportHref}
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 px-5 text-sm font-semibold text-primary transition hover:bg-primary/15"
        >
          Exporter PDF
        </a>
      </div>

      <StatisticsFilters
        events={events}
        sessionTimes={statistics.availableSessionTimes || []}
        selectedEventId={filters.eventId}
        selectedSessionTime={filters.sessionTime}
        dateStart={filters.dateStart}
        dateEnd={filters.dateEnd}
        selectedView={selectedView}
        viewOptions={VIEW_OPTIONS}
      />

      {message ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {message}
        </div>
      ) : null}

      {eventsResult?.error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {eventsResult.error}
        </div>
      ) : null}

      {ok ? <StatisticsSummaryCards totals={statistics.totals} /> : null}

      {(() => {
        const selectedContent = buildSelectedView(statistics, selectedView);

        if (selectedContent.type === "table") {
          return (
            <SessionStatsTable
              rows={statistics.sessionRows}
              pricingColumns={statistics.pricingColumns}
            />
          );
        }

        return (
          <StatisticsBarChart
            title={selectedContent.title}
            description={selectedContent.description}
            items={selectedContent.items}
            valueLabel={selectedContent.valueLabel}
          />
        );
      })()}
    </div>
  );
}
