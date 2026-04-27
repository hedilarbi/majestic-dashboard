import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { formatDateTime, formatPrice } from "@/lib/configurations/formatters";
import { getCashierOverview } from "@/services/cash-registers";

export default async function CashierOverviewPage() {
  const { ok, cashierBalance, ticketOffices, message } =
    await getCashierOverview();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          Caisse guichets
        </h1>
      </div>

      {ok ? (
        <div className="grid gap-4 md:grid-cols-3">
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
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Guichets suivis
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {ticketOffices.length}
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
                <th className="px-6 py-4 text-left font-semibold">Statut</th>
                <th className="px-6 py-4 text-left font-semibold">
                  Caisse courante
                </th>
                <th className="px-6 py-4 text-left font-semibold">
                  Transactions
                </th>
                <th className="px-6 py-4 text-left font-semibold">
                  Dernière clôture
                </th>
                <th className="px-6 py-4 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {ticketOffices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8">
                    Aucun guichet trouvé.
                  </td>
                </tr>
              ) : (
                ticketOffices.map((item) => (
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
                        {item?.staff?.status === "suspended"
                          ? "Suspendu"
                          : "Actif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatPrice(item?.currentBalance?.amount || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        {item?.currentBalance?.bookingCount || 0} vente(s) billets
                      </div>
                      <div className="text-xs text-slate-500">
                        {item?.currentBalance?.ticketCount || 0} billet(s)
                      </div>
                      <div className="text-xs text-slate-500">
                        {item?.currentBalance?.subscriptionSaleCount || 0} abonnement(s)
                      </div>
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
                          href={`/caissier/guichets/${item.staff.id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-primary"
                          aria-label="Voir la caisse du guichet"
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
    </div>
  );
}
