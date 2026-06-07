import DashboardAccessDenied from "@/components/dashboard/access-denied";
import { formatPrice } from "@/lib/configurations/formatters";
import { hasDashboardPermission } from "@/lib/dashboard-permissions";
import { getDashboardUser } from "@/services/dashboard-auth";
import { getAuditLogs } from "@/services/audit-logs";

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ACTION_LABELS = {
  ticket_cancellation: "Billet annulé",
  ticket_print: "Réimpression",
};

const ACTION_STYLES = {
  ticket_cancellation: "bg-rose-100 text-rose-700",
  ticket_print: "bg-sky-100 text-sky-700",
};

const ROLE_LABELS = {
  super_admin: "Super administrateur",
  admin: "Administrateur",
  ticket_office: "Guichet",
  cashier: "Caissier",
  blog_manager: "Gestion blogue",
  door_staff: "Contrôle",
};

const getTypeFilter = (value) => {
  if (value === "ticket_cancellation" || value === "ticket_print") {
    return value;
  }
  return "";
};

const getTicketPrintCount = (item, ticket) => {
  const ticketPrints = Array.isArray(item?.details?.ticketPrints)
    ? item.details.ticketPrints
    : [];
  const ticketId = ticket?.id || "";
  const ticketCode = ticket?.code || "";
  const detail = ticketPrints.find(
    (entry) =>
      (ticketId && entry?.ticketId === ticketId) ||
      (ticketCode && entry?.code === ticketCode),
  );
  const detailCount = Number(detail?.printCount);
  const ticketCount = Number(ticket?.printCount);
  const counts = [ticketCount, detailCount].filter(Number.isFinite);

  return counts.length ? Math.max(...counts) : 0;
};

const buildFallbackTickets = (item) => {
  const codes = Array.isArray(item?.ticketCodes) ? item.ticketCodes : [];
  const seats = Array.isArray(item?.seatLabels) ? item.seatLabels : [];

  return codes.map((code, index) => ({
    id: `${item?.id || "audit"}:${code || index}`,
    code,
    seatLabel: seats[index] || "",
    printCount: 0,
  }));
};

const buildTicketAuditRows = (items = []) => {
  const rowsByKey = new Map();

  items.forEach((item) => {
    const tickets = Array.isArray(item?.tickets) && item.tickets.length
      ? item.tickets
      : buildFallbackTickets(item);

    tickets.forEach((ticket, index) => {
      const printCount = getTicketPrintCount(item, ticket);
      const isCancellation = item.actionType === "ticket_cancellation";
      const isReprint = item.actionType === "ticket_print" && printCount > 1;

      if (!isCancellation && !isReprint) {
        return;
      }

      const rowKey = [
        item.actionType,
        ticket?.id || ticket?.code || item.id || index,
      ].join(":");

      if (rowsByKey.has(rowKey)) {
        return;
      }

      rowsByKey.set(rowKey, {
        id: rowKey,
        actionType: item.actionType,
        createdAt: item.createdAt,
        actor: item.actor,
        booking: item.booking,
        session: item.session,
        ticket,
        printCount,
      });
    });
  });

  return Array.from(rowsByKey.values());
};

export default async function AuditPage({ searchParams }) {
  const user = await getDashboardUser();

  if (!hasDashboardPermission(user, "audit_logs", "list")) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter l'audit." />
    );
  }

  const resolvedSearchParams = await searchParams;
  const type = getTypeFilter(resolvedSearchParams?.type);
  const dateFrom =
    typeof resolvedSearchParams?.dateFrom === "string"
      ? resolvedSearchParams.dateFrom
      : "";
  const dateTo =
    typeof resolvedSearchParams?.dateTo === "string"
      ? resolvedSearchParams.dateTo
      : "";

  const { ok, items, message } = await getAuditLogs({
    type,
    view: "ticket_tracking",
    dateFrom,
    dateTo,
    limit: 200,
  });

  const ticketAuditRows = buildTicketAuditRows(items);
  const cancellationCount = ticketAuditRows.filter(
    (item) => item.actionType === "ticket_cancellation",
  ).length;
  const reprintCount = ticketAuditRows.filter(
    (item) => item.actionType === "ticket_print",
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-secondary text-3xl font-semibold text-slate-900 uppercase">
            Audit
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Billets annulés et billets imprimés plus d&apos;une fois.
          </p>
        </div>

        <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Type
            <select
              name="type"
              defaultValue={type}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Tous</option>
              <option value="ticket_cancellation">Billets annulés</option>
              <option value="ticket_print">Réimpressions</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            De
            <input
              type="date"
              name="dateFrom"
              defaultValue={dateFrom}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            À
            <input
              type="date"
              name="dateTo"
              defaultValue={dateTo}
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <button
            type="submit"
            className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Filtrer
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            Billets suivis
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {ticketAuditRows.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            Billets annulés
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {cancellationCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            Réimpressions
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {reprintCount}
          </p>
        </div>
      </div>

      {!ok ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {message || "Impossible de charger l'audit."}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-slate-500">
                  Date
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500">
                  Action
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500">
                  Acteur
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500">
                  Référence
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500">
                  Séance
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500">
                  Billets
                </th>
                <th className="px-6 py-4 text-left font-semibold text-slate-500">
                  Détail
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {ticketAuditRows.length ? (
                ticketAuditRows.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-600">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            ACTION_STYLES[item.actionType] ||
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {ACTION_LABELS[item.actionType] || item.actionType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">
                            {item.actor.name || "-"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {ROLE_LABELS[item.actor.role] || item.actor.role || "-"}
                          </span>
                          {item.actor.email ? (
                            <span className="text-xs text-slate-400">
                              {item.actor.email}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {item.booking.bookingNumber || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {item.session.eventName || "-"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {item.session.date
                              ? formatDateTime(item.session.date)
                              : "-"}
                            {item.session.sessionTime
                              ? ` • ${item.session.sessionTime}`
                              : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">
                            {item.ticket?.code || "-"}
                          </span>
                          <span className="text-xs text-slate-500">
                            Siège : {item.ticket?.seatLabel || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="max-w-md">
                          <p>
                            {item.actionType === "ticket_cancellation"
                              ? "Billet annulé"
                              : `${item.printCount} impressions`}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {item.ticket?.pricingName || "Tarif"} •{" "}
                            {formatPrice(item.ticket?.price || 0)}
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-slate-500"
                  >
                    Aucun billet annulé ou réimprimé trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
