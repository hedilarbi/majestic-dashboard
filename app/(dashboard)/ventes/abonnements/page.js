import DashboardAccessDenied from "@/components/dashboard/access-denied";
import ExportButtons from "@/components/dashboard/export-buttons";
import { formatDateTime, formatPrice } from "@/lib/configurations/formatters";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import { getSalesSubscriptions } from "@/services/sales";

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

const formatUser = (user, customerContact) => {
  if (!user && !customerContact) {
    return "-";
  }
  const source = user || customerContact;
  const name = `${source.firstName || ""} ${source.lastName || ""}`.trim();
  return name || source.email || "-";
};

export default async function AbonnementsVendusPage({ searchParams }) {
  const canList = await canAccessDashboardPermission(
    "sales_subscriptions",
    "list",
  );

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les abonnements vendus." />
    );
  }

  const resolvedParams = await searchParams;
  const filters = {
    dateFrom: parseSearchParam(resolvedParams?.dateFrom),
    dateTo: parseSearchParam(resolvedParams?.dateTo),
    paymentMethod: parseSearchParam(resolvedParams?.paymentMethod),
    paymentStatus: parseSearchParam(resolvedParams?.paymentStatus),
    status: parseSearchParam(resolvedParams?.status),
    source: parseSearchParam(resolvedParams?.source),
  };
  const exportQueryString = buildQueryString(filters);
  const { items, error } = await getSalesSubscriptions({
    limit: 200,
    ...filters,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            Abonnements vendus
          </h1>
          <p className="text-sm text-slate-500">
            Suivi des ventes d&apos;abonnements enregistrées.
          </p>
        </div>
        <ExportButtons resource="abonnements" queryString={exportQueryString} />
      </div>

      <form
        method="GET"
        className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3 lg:grid-cols-6"
      >
        <input
          type="date"
          name="dateFrom"
          defaultValue={filters.dateFrom}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Date début"
        />
        <input
          type="date"
          name="dateTo"
          defaultValue={filters.dateTo}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Date fin"
        />
        <select
          name="paymentMethod"
          defaultValue={filters.paymentMethod}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Paiement</option>
          <option value="online">En ligne</option>
          <option value="cash">Espèces</option>
          <option value="card">Carte</option>
          <option value="transfer">Virement</option>
        </select>
        <select
          name="paymentStatus"
          defaultValue={filters.paymentStatus}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Statut paiement</option>
          <option value="pending">En attente</option>
          <option value="completed">Payé</option>
          <option value="failed">Échoué</option>
          <option value="refunded">Remboursé</option>
        </select>
        <select
          name="source"
          defaultValue={filters.source}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Source</option>
          <option value="web">Web</option>
          <option value="mobile">Mobile</option>
          <option value="ticket_office">Guichet</option>
        </select>
        <div className="flex gap-2">
          <select
            name="status"
            defaultValue={filters.status}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Statut</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmé</option>
            <option value="cancelled">Annulé</option>
            <option value="refunded">Remboursé</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Filtrer
          </button>
        </div>
      </form>

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
                <th className="px-6 py-4 text-left font-semibold">Client</th>
                <th className="px-6 py-4 text-left font-semibold">Abonnement</th>
                <th className="px-6 py-4 text-left font-semibold">Prix</th>
                <th className="px-6 py-4 text-left font-semibold">Credits</th>
                <th className="px-6 py-4 text-left font-semibold">Paiement</th>
                <th className="px-6 py-4 text-left font-semibold">Statut</th>
                <th className="px-6 py-4 text-left font-semibold">Vendeur</th>
                <th className="px-6 py-4 text-left font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {items.length === 0 ? (
                <tr>
                  <td className="px-6 py-8" colSpan={8}>
                    Aucun abonnement actif.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      {formatUser(row.user, row.customerContact)}
                    </td>
                    <td className="px-6 py-4">
                      {row.subscription?.name || "-"}
                    </td>
                    <td className="px-6 py-4">{formatPrice(row.price)}</td>
                    <td className="px-6 py-4">
                      {row.totalCredits ?? row.subscription?.totalCredits ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="capitalize text-slate-800">
                        {row.paymentMethod || "-"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {row.paymentStatus || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 capitalize">
                      {row.status || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {formatUser(row.soldBy)}
                    </td>
                    <td className="px-6 py-4">
                      {formatDateTime(row.createdAt)}
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
