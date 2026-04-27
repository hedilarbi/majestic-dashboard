import Link from "next/link";

import DashboardAccessDenied from "@/components/dashboard/access-denied";
import CashierRegisterCloseAction from "@/components/dashboard/CashierRegisterCloseAction";
import { Icon } from "@/components/ui/icons";
import { formatDateTime, formatPrice } from "@/lib/configurations/formatters";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import { getSupervisorCashierDetails } from "@/services/cash-registers";

const formatReduction = (item) => {
  if (item?.usedSubscription) {
    return "Abonnement";
  }

  if (!item?.promotion) {
    return item?.reductionAmount > 0 ? `-${formatPrice(item.reductionAmount)}` : "-";
  }

  const valueLabel = item.promotion?.reductionLabel || "";
  const discountLabel =
  item?.reductionAmount > 0 ? `-${formatPrice(item.reductionAmount)}` : "";

  return [valueLabel, discountLabel].filter(Boolean).join(" • ") || "-";
};

const formatCustomerContact = (contact) => {
  const fullName = [contact?.firstName || "", contact?.lastName || ""].
  join(" ").
  trim();

  if (fullName && contact?.email) {
    return `${fullName} • ${contact.email}`;
  }

  return fullName || contact?.email || "-";
};

export default async function CashierRegisterDetailsPage({ params }) {
  const canList = await canAccessDashboardPermission("cash_registers", "list");

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les caisses." />);

  }

  const { cashierId } = await params;
  const { ok, details: details, message } = await getSupervisorCashierDetails(cashierId);
  const canClose = await canAccessDashboardPermission("cash_registers", "update");

  if (!ok || !details) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href="/caisse"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
          aria-label="Retour aux caisses">

          <Icon name="chevronLeft" className="h-4 w-4" />
        </Link>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {message || "Impossible de charger le détail du caissier."}
        </div>
      </div>);

  }

  const transfers = Array.isArray(details.transfers) ? details.transfers : [];
  const ticketItems = Array.isArray(details.ticketItems) ? details.ticketItems : [];
  const subscriptionSales = Array.isArray(details.subscriptionSales) ?
  details.subscriptionSales :
  [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/caisse"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
            aria-label="Retour aux caisses">

            <Icon name="chevronLeft" className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-slate-900">
              {details?.staff?.fullName || "Caissier"}
            </h1>
            <p className="text-sm text-slate-500">{details?.staff?.email || "-"}</p>
          </div>
        </div>

        {canClose ?
        <div className="md:flex md:justify-end">
            <CashierRegisterCloseAction
            staffId={details?.staff?.id}
            disabled={transfers.length === 0}
            pendingAmount={details?.currentBalance?.amount || 0}
            transferCount={details?.currentBalance?.transferCount || 0} />

          </div> :
        null}
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Caisse actuelle
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {formatPrice(details?.currentBalance?.amount || 0)}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Clôtures guichets
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {details?.currentBalance?.transferCount || 0}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ventes billets
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {details?.currentBalance?.bookingCount || 0}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Billets
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {details?.currentBalance?.ticketCount || 0}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Abonnements
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {details?.currentBalance?.subscriptionSaleCount || 0}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Billets actifs
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Guichet</th>
                  <th className="px-6 py-4 text-left font-semibold">Vente</th>
                  <th className="px-6 py-4 text-left font-semibold">Billet</th>
                  <th className="px-6 py-4 text-left font-semibold">Séance</th>
                  <th className="px-6 py-4 text-left font-semibold">Tarif</th>
                  <th className="px-6 py-4 text-left font-semibold">Prix brut</th>
                  <th className="px-6 py-4 text-left font-semibold">Reduction</th>
                  <th className="px-6 py-4 text-left font-semibold">Prix final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                {ticketItems.length === 0 ?
                <tr>
                    <td colSpan={8} className="px-6 py-8">
                      Aucun billet actif dans cette caisse.
                    </td>
                  </tr> :

                ticketItems.map((item) =>
                <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {[item?.ticketOffice?.firstName || "", item?.ticketOffice?.lastName || ""].
                      join(" ").
                      trim() || item?.ticketOffice?.email || "-"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item?.ticketOffice?.email || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {item?.bookingNumber || "-"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDateTime(item?.soldAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {item?.code || "-"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item?.seat?.row &&
                      Number.isFinite(Number(item?.seat?.col)) ?
                      `${item.seat.row}${item.seat.col}` :
                      "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {item?.session?.eventName || "-"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item?.session?.date || item?.session?.sessionTime ?
                      `${item?.session?.date ? formatDateTime(item.session.date) : ""}${
                      item?.session?.sessionTime ?
                      ` • ${item.session.sessionTime}` :
                      ""}` :

                      "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {item?.pricingName || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">{formatPrice(item?.basePrice || 0)}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {formatReduction(item)}
                        </div>
                        {item?.promotion?.code ?
                    <div className="text-xs text-slate-500">
                            {item.promotion.code}
                          </div> :
                    null}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {formatPrice(item?.finalPrice || 0)}
                      </td>
                    </tr>
                )
                }
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Abonnements vendus
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Guichet</th>
                  <th className="px-6 py-4 text-left font-semibold">Code</th>
                  <th className="px-6 py-4 text-left font-semibold">
                    Abonnement
                  </th>
                  <th className="px-6 py-4 text-left font-semibold">Client</th>
                  <th className="px-6 py-4 text-left font-semibold">Date</th>
                  <th className="px-6 py-4 text-left font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                {subscriptionSales.length === 0 ?
                <tr>
                    <td colSpan={6} className="px-6 py-8">
                      Aucun abonnement actif dans cette caisse.
                    </td>
                  </tr> :

                subscriptionSales.map((sale) =>
                <tr key={sale.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {[sale?.ticketOffice?.firstName || "", sale?.ticketOffice?.lastName || ""].
                      join(" ").
                      trim() || sale?.ticketOffice?.email || "-"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {sale?.ticketOffice?.email || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {sale?.subscriptionCode || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {sale?.subscriptionName || "-"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {sale?.totalCredits || 0} crédit(s)
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {formatCustomerContact(sale?.customerContact)}
                      </td>
                      <td className="px-6 py-4">{formatDateTime(sale?.soldAt)}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {formatPrice(sale?.totalAmount || 0)}
                      </td>
                    </tr>
                )
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>);

}