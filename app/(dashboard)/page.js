import Link from "next/link";

import DashboardAccessDenied from "@/components/dashboard/access-denied";
import { Icon } from "@/components/ui/icons";
import {
  formatDate,
  formatDateTime,
  formatPrice,
} from "@/lib/configurations/formatters";
import {
  DASHBOARD_PERMISSION_DEFINITIONS,
  DASHBOARD_ROLE_LABELS,
  hasDashboardPermission,
} from "@/lib/dashboard-permissions";
import { getDashboardUser } from "@/services/dashboard-auth";
import { getEvents } from "@/services/evenements";
import { getReservationRequests } from "@/services/reservation-requests";
import { getSalesTransactions } from "@/services/sales";
import { getSessions } from "@/services/sessions";
import { getStatistics } from "@/services/statistics";

const HERO_ACTIONS = [
  {
    label: "Voir les statistiques",
    href: "/statistiques",
    module: "statistics",
    icon: "activity",
  },
  {
    label: "Ouvrir les événements",
    href: "/evenements",
    module: "events",
    icon: "ticket",
  },
  {
    label: "Suivre les séances",
    href: "/seances",
    module: "sessions",
    icon: "calendar",
  },
  {
    label: "Voir les transactions",
    href: "/ventes/transactions",
    module: "sales_transactions",
    icon: "money",
  },
  {
    label: "Traiter les demandes",
    href: "/demandes-reservation",
    module: "reservation_requests",
    icon: "form",
  },
];

const QUICK_LINKS = [
  {
    label: "Statistiques",
    description: "Analyser les ventes, les tarifs et les canaux.",
    href: "/statistiques",
    module: "statistics",
    icon: "activity",
  },
  {
    label: "Événements",
    description: "Mettre a jour la programmation et les contenus.",
    href: "/evenements",
    module: "events",
    icon: "ticket",
  },
  {
    label: "Séances",
    description: "Verifier les séances programmées et leurs statuts.",
    href: "/seances",
    module: "sessions",
    icon: "calendar",
  },
  {
    label: "Transactions",
    description: "Consulter les ventes enregistrées par le système.",
    href: "/ventes/transactions",
    module: "sales_transactions",
    icon: "money",
  },
  {
    label: "Demandes de réservation",
    description: "Traiter les demandes d'espace envoyées depuis le site.",
    href: "/demandes-reservation",
    module: "reservation_requests",
    icon: "form",
  },
  {
    label: "Soumissions de formulaires",
    description: "Voir les candidatures et réponses des formulaires publiés.",
    href: "/soumissions-formulaires",
    module: "blog_form_submissions",
    icon: "article",
  },
  {
    label: "Caisse",
    description: "Suivre les clôtures et les montants consolides.",
    href: "/caisse",
    module: "cash_registers",
    icon: "money",
  },
  {
    label: "Staffs",
    description: "Gerer les comptes internes et leurs accès.",
    href: "/staffs",
    module: "staffs",
    icon: "users",
  },
];

const pad = (value) => String(value).padStart(2, "0");

const toLocalDateParam = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const capitalize = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

const formatLongDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return capitalize(
    date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
  );
};

const formatCompactDateTime = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString("fr-FR") : "-";
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

  const eventName = session?.event?.name || session?.eventName || "Séance";
  const dateLabel = formatSessionDateOnly(session?.date);
  const timeLabel = session?.sessionTime || session?.timeLabel || "";

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

  return "Web";
};

const getAccessibleModulesCount = (user) =>
  DASHBOARD_PERMISSION_DEFINITIONS.filter((definition) =>
    hasDashboardPermission(user, definition.module, "list"),
  ).length;

const getTicketSummary = (session) => {
  const totalSeats = Number(session?.totalSeats);
  const availableSeats = Number(session?.availableSeats);

  if (!Number.isFinite(totalSeats) || totalSeats <= 0) {
    return {
      soldTicketsLabel: "-",
      remainingTicketsLabel: "-",
    };
  }

  const remaining = Number.isFinite(availableSeats)
    ? Math.max(availableSeats, 0)
    : 0;
  const sold = Math.max(totalSeats - remaining, 0);

  return {
    soldTicketsLabel: `${formatNumber(sold)} vendu(s)`,
    remainingTicketsLabel: `${formatNumber(remaining)} restant(s)`,
  };
};

function SummaryCard({ label, value, description, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function Panel({ title, description, action, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description ? (
            <p className="text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

export default async function DashboardPage() {
  const user = await getDashboardUser();

  if (!hasDashboardPermission(user, "dashboard", "list")) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission d'accéder au tableau de bord." />
    );
  }

  const now = new Date();
  const today = toLocalDateParam(now);
  const roleLabel =
    DASHBOARD_ROLE_LABELS[user?.role] || DASHBOARD_ROLE_LABELS.admin;

  const canViewStatistics = hasDashboardPermission(user, "statistics", "list");
  const canViewEvents = hasDashboardPermission(user, "events", "list");
  const canViewSessions = hasDashboardPermission(user, "sessions", "list");
  const canViewRequests = hasDashboardPermission(
    user,
    "reservation_requests",
    "list",
  );
  const canViewTransactions = hasDashboardPermission(
    user,
    "sales_transactions",
    "list",
  );

  const [
    statisticsResult,
    activeEventsResult,
    upcomingSessionsResult,
    pendingSessionsResult,
    pendingRequestsResult,
    recentTransactionsResult,
  ] = await Promise.all([
    canViewStatistics
      ? getStatistics({ dateStart: today, dateEnd: today })
      : Promise.resolve(null),
    canViewEvents
      ? getEvents({ page: 1, limit: 1, status: "active" })
      : Promise.resolve(null),
    canViewSessions
      ? getSessions({ page: 1, limit: 6, from: today })
      : Promise.resolve(null),
    canViewSessions
      ? getSessions({ page: 1, limit: 1, from: today, status: "pending" })
      : Promise.resolve(null),
    canViewRequests
      ? getReservationRequests({ status: "pending" })
      : Promise.resolve(null),
    canViewTransactions
      ? getSalesTransactions({ limit: 5 })
      : Promise.resolve(null),
  ]);

  const statistics = statisticsResult?.ok ? statisticsResult.data : null;
  const statisticsError =
    statisticsResult && !statisticsResult.ok ? statisticsResult.message : "";

  const activeEventsTotal = Number.isFinite(
    activeEventsResult?.pagination?.total,
  )
    ? activeEventsResult.pagination.total
    : null;
  const upcomingSessions = Array.isArray(upcomingSessionsResult?.items)
    ? upcomingSessionsResult.items
    : [];
  const upcomingSessionsTotal = Number.isFinite(
    upcomingSessionsResult?.pagination?.total,
  )
    ? upcomingSessionsResult.pagination.total
    : upcomingSessions.length;
  const pendingSessionsCount = Number.isFinite(
    pendingSessionsResult?.pagination?.total,
  )
    ? pendingSessionsResult.pagination.total
    : 0;
  const pendingRequests = Array.isArray(pendingRequestsResult?.items)
    ? pendingRequestsResult.items
    : [];
  const pendingRequestsCount = pendingRequests.length;
  const recentTransactions = Array.isArray(recentTransactionsResult?.items)
    ? recentTransactionsResult.items.slice(0, 5)
    : [];

  const accessibleModulesCount = getAccessibleModulesCount(user);
  const itemsToProcess = pendingSessionsCount + pendingRequestsCount;

  const summaryCards = [
    activeEventsTotal !== null
      ? {
          label: "Événements actifs",
          value: formatNumber(activeEventsTotal),
          description: "Programmation actuellement visible dans le système.",
          icon: "theater",
        }
      : null,
    statistics
      ? {
          label: "Séances du jour",
          value: formatNumber(statistics?.totals?.sessionsCount || 0),
          description: "Séances programmées a la date d'aujourd'hui.",
          icon: "calendar",
        }
      : null,
    statistics
      ? {
          label: "Billets vendus",
          value: formatNumber(statistics?.totals?.soldTickets || 0),
          description: "Ventes cumulees sur les séances du jour.",
          icon: "activity",
        }
      : null,
    statistics
      ? {
          label: "Recette du jour",
          value: formatPrice(statistics?.totals?.revenue || 0),
          description: "Montant cumule sur les séances du jour.",
          icon: "money",
        }
      : null,
    canViewRequests
      ? {
          label: "Demandes en attente",
          value: formatNumber(pendingRequestsCount),
          description: "Demandes d'espace encore non traitees.",
          icon: "form",
        }
      : canViewSessions
        ? {
            label: "Séances à confirmer",
            value: formatNumber(pendingSessionsCount),
            description: "Séances encore en attente de validation.",
            icon: "clock",
          }
        : null,
  ].filter(Boolean);

  const todayPlatforms = Array.isArray(statistics?.charts?.platforms)
    ? statistics.charts.platforms
    : [];
  const totalPlatformTickets = todayPlatforms.reduce(
    (sum, item) => sum + (Number(item?.ticketsSold) || 0),
    0,
  );
  const platformRows = todayPlatforms.map((item) => {
    const ticketsSold = Number(item?.ticketsSold) || 0;
    const percent =
      totalPlatformTickets > 0
        ? Math.round((ticketsSold / totalPlatformTickets) * 100)
        : 0;

    return {
      label: item?.label || "-",
      ticketsSold,
      percent,
      revenue: Number(item?.revenue) || 0,
    };
  });

  const subscriptionUsage = Array.isArray(statistics?.charts?.subscriptionUsage)
    ? statistics.charts.subscriptionUsage.find(
        (item) => item?.label === "Avec abonnement",
      )
    : null;
  const promoUsage = Array.isArray(statistics?.charts?.promoUsage)
    ? statistics.charts.promoUsage.find(
        (item) => item?.label === "Avec code promo",
      )
    : null;

  const attentionItems = [
    canViewSessions
      ? {
          label: "Séances à venir",
          value: formatNumber(upcomingSessionsTotal),
          description: "Toutes les séances a partir d'aujourd'hui.",
          href: "/seances",
        }
      : null,
    canViewSessions
      ? {
          label: "Séances à confirmer",
          value: formatNumber(pendingSessionsCount),
          description: "Creation faite, confirmation encore attendue.",
          href: "/seances?status=pending",
        }
      : null,
    canViewRequests
      ? {
          label: "Demandes de réservation",
          value: formatNumber(pendingRequestsCount),
          description: "Demandes d'espace en attente de traitement.",
          href: "/demandes-reservation",
        }
      : null,
  ].filter(Boolean);

  const quickLinks = QUICK_LINKS.filter((item) =>
    hasDashboardPermission(user, item.module, "list"),
  );
  const heroActions = HERO_ACTIONS.filter((item) =>
    hasDashboardPermission(user, item.module, "list"),
  ).slice(0, 3);

  const issues = Array.from(
    new Set(
      [
        statisticsError,
        activeEventsResult?.error,
        upcomingSessionsResult?.error,
        pendingSessionsResult?.error,
        pendingRequestsResult?.error,
        recentTransactionsResult?.error,
      ].filter(Boolean),
    ),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 right-0 hidden w-80 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent lg:block" />
          <div className="relative grid gap-8 px-6 py-6 lg:grid-cols-[1.35fr_0.9fr] lg:px-8 lg:py-8">
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Centre de pilotage
              </span>

              <div className="space-y-3">
                <div className="space-y-1">
                  <h1 className="font-secondary text-3xl font-semibold tracking-tight text-slate-900">
                    Bienvenue, {user?.firstName || "Equipe"}.
                  </h1>
                </div>

                {heroActions.length ? (
                  <div className="flex flex-wrap gap-3">
                    {heroActions.map((action, index) => (
                      <Link
                        key={action.href}
                        href={action.href}
                        className={
                          index === 0
                            ? "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-primary/30 transition hover:bg-primary/90"
                            : "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-primary/30 hover:text-primary"
                        }
                      >
                        <Icon name={action.icon} className="h-4 w-4" />
                        <span>{action.label}</span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Aujourd&apos;hui
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatLongDate(now)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Mise à jour {formatCompactDateTime(now)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Role
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {roleLabel}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Espace admin principal
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Modules accessibles
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatNumber(accessibleModulesCount)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Navigation adaptee a vos permissions
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  À traiter
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatNumber(itemsToProcess)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Séances en attente et demandes de réservation
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {issues.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <p className="font-semibold text-amber-800">
            Certaines données n&apos;ont pas pu être chargees.
          </p>
          <ul className="mt-2 space-y-1">
            {issues.map((issue) => (
              <li key={issue}>• {issue}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {summaryCards.length ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        {quickLinks.length ? (
          <Panel
            title="Accès rapides"
            description="Raccourcis vers les modules les plus utiles pour demarrer."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {quickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm ring-1 ring-slate-200 transition group-hover:ring-primary/20">
                      <Icon name={item.icon} className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 ring-1 ring-slate-200">
                      Module
                    </span>
                  </div>
                  <div className="mt-4 space-y-1">
                    <p className="font-semibold text-slate-900">{item.label}</p>
                    <p className="text-sm leading-6 text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Panel>
        ) : null}

        <div className="space-y-6">
          {attentionItems.length ? (
            <Panel
              title="Points d'attention"
              description="Les sujets qui demandent un passage rapide."
            >
              <div className="space-y-3">
                {attentionItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">
                        {item.label}
                      </p>
                      <p className="text-sm text-slate-500">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold tracking-tight text-slate-900">
                        {item.value}
                      </p>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        a vérifier
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>
          ) : null}

          {canViewStatistics ? (
            <Panel
              title="Reperes du jour"
              description="Lecture rapide des ventes sur les séances d'aujourd'hui."
            >
              <div className="space-y-5">
                {platformRows.length ? (
                  <div className="space-y-4">
                    {platformRows.map((item) => (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between gap-4 text-sm">
                          <div>
                            <p className="font-medium text-slate-900">
                              {item.label}
                            </p>
                            <p className="text-slate-500">
                              {formatNumber(item.ticketsSold)} billet(s) •{" "}
                              {formatPrice(item.revenue)}
                            </p>
                          </div>
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            {item.percent}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Aucune vente enregistrée sur les séances du jour pour le
                    moment.
                  </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Paiement abonnement
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {formatNumber(subscriptionUsage?.bookingCount || 0)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      transaction(s) •{" "}
                      {formatNumber(subscriptionUsage?.ticketsSold || 0)}{" "}
                      billet(s)
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Code promo
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {formatNumber(promoUsage?.bookingCount || 0)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      remise totale{" "}
                      {formatPrice(promoUsage?.discountAmount || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </Panel>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {canViewSessions ? (
          <Panel
            title="Séances a surveiller"
            description="Prochaines séances programmées a partir d'aujourd'hui."
            action={
              <Link
                href="/seances"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-primary/30 hover:text-primary"
              >
                <span>Voir tout</span>
                <Icon name="chevronLeft" className="h-4 w-4 rotate-180" />
              </Link>
            }
          >
            {upcomingSessions.length ? (
              <div className="space-y-3">
                {upcomingSessions.map((session) => {
                  const ticketSummary = getTicketSummary(session);

                  return (
                    <Link
                      key={session.id}
                      href={
                        session.eventId
                          ? `/evenements/${session.eventId}`
                          : "/seances"
                      }
                      className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-primary/30 hover:bg-primary/5"
                    >
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-slate-200 ${session?.statusMeta?.color || "text-slate-500"}`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${session?.statusMeta?.dot || "bg-slate-400"}`}
                            />
                            {session?.statusMeta?.label || "Programme"}
                          </span>
                          {session.roomName ? (
                            <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                              {session.roomName}
                            </span>
                          ) : null}
                        </div>

                        <div>
                          <p className="truncate font-semibold text-slate-900">
                            {session.eventName || "Séance"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {session.dateLabel || formatDate(session.date)} •{" "}
                            {session.timeLabel || session.sessionTime || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {ticketSummary.soldTicketsLabel}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {ticketSummary.remainingTicketsLabel}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Aucune séance à venir pour le moment.
              </p>
            )}
          </Panel>
        ) : null}

        {canViewTransactions ? (
          <Panel
            title="Dernières transactions"
            description="Derniers bookings visibles depuis le dashboard."
            action={
              <Link
                href="/ventes/transactions"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-primary/30 hover:text-primary"
              >
                <span>Voir tout</span>
                <Icon name="chevronLeft" className="h-4 w-4 rotate-180" />
              </Link>
            }
          >
            {recentTransactions.length ? (
              <div className="space-y-3">
                {recentTransactions.map((booking) => (
                  <Link
                    key={booking.id}
                    href={
                      booking.id
                        ? `/ventes/transactions/${booking.id}`
                        : "/ventes/transactions"
                    }
                    className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="min-w-0 space-y-2">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {booking.bookingNumber || "-"}
                        </p>
                        <p className="truncate text-sm text-slate-500">
                          {formatSessionLabel(booking.session)}
                        </p>
                      </div>
                      <p className="text-sm text-slate-500">
                        {formatBookingActor(booking)}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-slate-900">
                        {formatPrice(booking.totalAmount)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDateTime(booking.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Aucune transaction visible pour le moment.
              </p>
            )}
          </Panel>
        ) : null}
      </div>

      {canViewRequests ? (
        <Panel
          title="Dernières demandes de réservation"
          description="Demandes d'espace encore en attente de traitement."
          action={
            <Link
              href="/demandes-reservation"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-primary/30 hover:text-primary"
            >
              <span>Voir tout</span>
              <Icon name="chevronLeft" className="h-4 w-4 rotate-180" />
            </Link>
          }
        >
          {pendingRequests.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {pendingRequests.slice(0, 4).map((item) => {
                const fullName = `${item.firstName || ""} ${
                  item.lastName || ""
                }`.trim();

                return (
                  <Link
                    key={item._id}
                    href={`/demandes-reservation/${item._id}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {fullName || "-"}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          {item.email || "-"}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        En attente
                      </span>
                    </div>

                    <div className="mt-4 space-y-1 text-sm text-slate-500">
                      <p>
                        Réservation souhaitee le{" "}
                        <span className="font-medium text-slate-700">
                          {formatDateTime(item.reservationDateTime)}
                        </span>
                      </p>
                      <p>Créée le {formatCompactDateTime(item.createdAt)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Aucune demande en attente pour le moment.
            </p>
          )}
        </Panel>
      ) : null}
    </div>
  );
}
