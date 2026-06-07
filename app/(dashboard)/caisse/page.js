import DashboardAccessDenied from "@/components/dashboard/access-denied";
import Link from "next/link";

import ExportButtons from "@/components/dashboard/export-buttons";
import { Icon } from "@/components/ui/icons";
import { formatDateTime, formatPrice } from "@/lib/configurations/formatters";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import {
  getSupervisorCashierClosureHistory,
  getSupervisorCashierOverview
} from "@/services/cash-registers";

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

export default async function CashRegistersPage({ searchParams }) {
  const canList = await canAccessDashboardPermission("cash_registers", "list");

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les caisses." />
    );
  }

  const resolvedParams = await searchParams;
  const filters = {
    dateFrom: parseSearchParam(resolvedParams?.dateFrom),
    dateTo: parseSearchParam(resolvedParams?.dateTo),
  };
  const exportQueryString = buildQueryString(filters);

  const [
    { ok, cashiers, message },
    { items: closureHistory, message: historyMessage }
  ] = await Promise.all([
    getSupervisorCashierOverview(),
    getSupervisorCashierClosureHistory({ limit: 100, ...filters })
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Caisse</h1>
        <p className="text-sm text-slate-500">
          Suivi des caisses ouvertes par les caissiers.
        </p>
      </div>

      {message ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {message}
        </div>
      ) : null}

      {historyMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {historyMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Caissier</th>
                <th className="px-6 py-4 text-left font-semibold">Statut</th>
                <th className="px-6 py-4 text-left font-semibold">Caisse courante</th>
                <th className="px-6 py-4 text-left font-semibold">Clôtures guichets</th>
                <th className="px-6 py-4 text-left font-semibold">Billets</th>
                <th className="px-6 py-4 text-left font-semibold">Abonnements</th>
                <th className="px-6 py-4 text-left font-semibold">Dernière clôture</th>
                <th className="px-6 py-4 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {!ok || cashiers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8">
                    Aucun caissier trouvé.
                  </td>
                </tr>
              ) : (
                cashiers.map((item) => (
                  <tr
                    key={item?.staff?.id || item?.staff?.email}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {item?.staff?.fullName || item?.staff?.email || "-"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item?.staff?.email || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item?.staff?.status === "suspended"
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {item?.staff?.status === "suspended" ? "Suspendu" : "Actif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatPrice(item?.currentBalance?.amount || 0)}
                    </td>
                    <td className="px-6 py-4">
                      {item?.currentBalance?.transferCount || 0}
                    </td>
                    <td className="px-6 py-4">
                      {item?.currentBalance?.ticketCount || 0}
                    </td>
                    <td className="px-6 py-4">
                      {item?.currentBalance?.subscriptionSaleCount || 0}
                    </td>
                    <td className="px-6 py-4">
                      {item?.lastClosure ? (
                        <div>
                          <div>{formatDateTime(item.lastClosure.closedAt)}</div>
                          <div className="text-xs text-slate-500">
                            {formatPrice(item.lastClosure.amount)}
                          </div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item?.staff?.id ? (
                        <Link
                          href={`/caisse/${item.staff.id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-primary"
                          aria-label="Voir la caisse du caissier"
                          title="Voir le détail"
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

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Historique clôtures admin / caissier
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Fermetures de caisse caissier validées depuis l&apos;espace admin.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <form method="GET" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                type="date"
                name="dateFrom"
                defaultValue={filters.dateFrom}
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label="Date début"
              />
              <input
                type="date"
                name="dateTo"
                defaultValue={filters.dateTo}
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label="Date fin"
              />
              <button
                type="submit"
                className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                Filtrer
              </button>
            </form>
            <ExportButtons resource="caisse" queryString={exportQueryString} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Date clôture</th>
                <th className="px-6 py-4 text-left font-semibold">Caissier</th>
                <th className="px-6 py-4 text-left font-semibold">Admin</th>
                <th className="px-6 py-4 text-left font-semibold">Période</th>
                <th className="px-6 py-4 text-left font-semibold">Clôtures guichets</th>
                <th className="px-6 py-4 text-left font-semibold">Billets</th>
                <th className="px-6 py-4 text-left font-semibold">Abonnements</th>
                <th className="px-6 py-4 text-left font-semibold">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {closureHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8">
                    Aucun historique de clôture caissier.
                  </td>
                </tr>
              ) : (
                closureHistory.map((closure) => (
                  <tr key={closure.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatDateTime(closure.closedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {[closure?.cashier?.firstName || "", closure?.cashier?.lastName || ""]
                          .join(" ")
                          .trim() || closure?.cashier?.email || "-"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {closure?.cashier?.email || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {[closure?.closedBy?.firstName || "", closure?.closedBy?.lastName || ""]
                          .join(" ")
                          .trim() || closure?.closedBy?.email || "-"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {closure?.closedBy?.email || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {formatDateTime(closure.periodStartAt)} → {formatDateTime(closure.periodEndAt)}
                    </td>
                    <td className="px-6 py-4">{closure.transferCount || 0}</td>
                    <td className="px-6 py-4">{closure.ticketCount || 0}</td>
                    <td className="px-6 py-4">{closure.subscriptionSaleCount || 0}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatPrice(closure.amount || 0)}
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
