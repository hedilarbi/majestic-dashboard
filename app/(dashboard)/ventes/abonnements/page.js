import DashboardAccessDenied from "@/components/dashboard/access-denied";
import { formatDateTime, formatPrice } from "@/lib/configurations/formatters";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import { getSalesSubscriptions } from "@/services/sales";

const formatUser = (user, customerContact) => {
  if (!user && !customerContact) {
    return "-";
  }
  const source = user || customerContact;
  const name = `${source.firstName || ""} ${source.lastName || ""}`.trim();
  return name || source.email || "-";
};

export default async function AbonnementsVendusPage() {
  const canList = await canAccessDashboardPermission(
    "sales_subscriptions",
    "list",
  );

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les abonnements vendus." />
    );
  }

  const { items, error } = await getSalesSubscriptions({ limit: 200 });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          Abonnements vendus
        </h1>
        <p className="text-sm text-slate-500">
          Suivi des ventes d&apos;abonnements enregistrées.
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
                <th className="px-6 py-4 text-left font-semibold">Client</th>
                <th className="px-6 py-4 text-left font-semibold">Abonnement</th>
                <th className="px-6 py-4 text-left font-semibold">Prix</th>
                <th className="px-6 py-4 text-left font-semibold">Credits</th>
                <th className="px-6 py-4 text-left font-semibold">Vendeur</th>
                <th className="px-6 py-4 text-left font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {items.length === 0 ? (
                <tr>
                  <td className="px-6 py-8" colSpan={6}>
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
