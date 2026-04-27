import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { formatDateTime, formatPrice } from "@/lib/configurations/formatters";
import { getCashierHistory } from "@/services/cash-registers";

export default async function CashierHistoryPage() {
  const { ok, items, cashierBalance, message } = await getCashierHistory();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Historique des clôtures</h1>
        <p className="text-sm text-slate-500">
          Journal des fermetures de caisse effectuées par ce caissier.
        </p>
      </div>

      {ok ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total caisse caissier
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {formatPrice(cashierBalance?.totalAmount || 0)}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Nombre de clôtures
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {cashierBalance?.closureCount || 0}
            </p>
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {message}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Guichet</th>
                <th className="px-6 py-4 text-left font-semibold">Date</th>
                <th className="px-6 py-4 text-left font-semibold">Montant</th>
                <th className="px-6 py-4 text-left font-semibold">Transactions</th>
                <th className="px-6 py-4 text-left font-semibold">Billets</th>
                <th className="px-6 py-4 text-left font-semibold">Abonnements</th>
                <th className="px-6 py-4 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8">
                    Aucune clôture enregistrée.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {[item?.ticketOffice?.firstName || "", item?.ticketOffice?.lastName || ""]
                          .join(" ")
                          .trim() || item?.ticketOffice?.email || "-"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item?.ticketOffice?.email || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">{formatDateTime(item.closedAt)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatPrice(item.amount)}
                    </td>
                    <td className="px-6 py-4">{item.bookingCount || 0}</td>
                    <td className="px-6 py-4">{item.ticketCount || 0}</td>
                    <td className="px-6 py-4">
                      {item.subscriptionSaleCount || 0}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/caissier/historique/${item.id}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-primary"
                        aria-label="Voir la clôture"
                        title="Voir le détail"
                      >
                        <Icon name="eye" className="h-4 w-4" />
                      </Link>
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
