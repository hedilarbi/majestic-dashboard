import Link from "next/link";

import CashRegisterCloseAction from "@/components/cashier/CashRegisterCloseAction";
import { Icon } from "@/components/ui/icons";
import { formatDateTime, formatPrice } from "@/lib/configurations/formatters";
import { getCashierTicketOfficeDetails } from "@/services/cash-registers";

const formatTariffBreakdown = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return <span>-</span>;
  }

  return (
    <div className="space-y-1">
      {items.map((item, index) =>
      <div
        key={`${item.pricingName || "tarif"}-${item.price || 0}-${index}`}
        className="whitespace-nowrap">

          {item.quantity} {item.pricingName} {formatPrice(item.price)}
        </div>
      )}
    </div>);

};

const formatPromotion = (promotion) => {
  if (!promotion?.code) {
    return "-";
  }

  const reductionValue = Number(promotion.reductionValue) || 0;
  const typeLabel = promotion.reductionType === "percent" ? "%" : "DT";

  return `${promotion.code} • ${reductionValue}${typeLabel}`;
};

const formatSessionCell = (session) => {
  if (!session) {
    return "-";
  }

  const parts = [];
  if (session.date) {
    parts.push(
      new Date(session.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      })
    );
  }
  if (session.sessionTime) {
    parts.push(session.sessionTime);
  }

  return parts.join(" • ") || "-";
};

const formatPeriodDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
};

const formatPeriodRange = (period) => {
  const start = formatDateTime(period?.periodStartAt);
  const end = formatDateTime(period?.periodEndAt);
  return [start, end].filter(Boolean).join(" → ") || "-";
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

export default async function CashierTicketOfficeDetailsPage({ params }) {
  const resolvedParams = await params;
  const staffId = resolvedParams?.staffId;
  const { ok, details: details, message } = await getCashierTicketOfficeDetails(staffId);

  if (!ok || !details) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href="/caissier"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary bg-primary text-white shadow-sm transition hover:bg-primary/90"
          aria-label="Retour aux guichets">

          <Icon name="chevronLeft" className="h-4 w-4" />
        </Link>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {message || "Impossible de charger le détail du guichet."}
        </div>
      </div>);

  }

  const transactions = Array.isArray(details.transactions) ? details.transactions : [];
  const subscriptionSales = Array.isArray(details.subscriptionSales) ?
  details.subscriptionSales :
  [];
  const pendingPeriods = Array.isArray(details.pendingPeriods) ?
  details.pendingPeriods :
  [];
  const firstPendingPeriod = pendingPeriods[0] || null;
  const currentAmount = details?.currentBalance?.amount || 0;
  const currentTickets = details?.currentBalance?.ticketCount || 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/caissier"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary bg-primary text-white shadow-sm transition hover:bg-primary/90"
            aria-label="Retour aux guichets">

            <Icon name="chevronLeft" className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold text-slate-900">
              {details?.staff?.fullName || "Guichet"}
            </h1>
            <p className="text-sm text-slate-500">{details?.staff?.email || "-"}</p>
          </div>
        </div>

        <div className="md:flex md:justify-end">
          <CashRegisterCloseAction
            staffId={details?.staff?.id}
            disabled={!firstPendingPeriod}
            pendingAmount={firstPendingPeriod?.amount || currentAmount}
            pendingTickets={firstPendingPeriod?.ticketCount || currentTickets}
            pendingSubscriptionSales={firstPendingPeriod?.subscriptionSaleCount || 0}
            periodStartAt={firstPendingPeriod?.periodStartAt || ""}
            periodLabel={
            firstPendingPeriod ? formatPeriodDate(firstPendingPeriod.businessDate) : ""
            } />

        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Caisse actuelle
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {formatPrice(currentAmount)}
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
              Billets vendus
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {currentTickets}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Abonnements vendus
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {details?.currentBalance?.subscriptionSaleCount || 0}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Feuilles de caisse à clôturer
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Les journées passées sont coupées automatiquement à minuit et restent en attente jusqu&apos;à clôture.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {pendingPeriods.length} feuille(s)
            </span>
          </div>

          {pendingPeriods.length === 0 ?
          <div className="px-6 py-8 text-sm text-slate-500">
              Aucune feuille ouverte pour ce guichet.
            </div> :
          <div className="divide-y divide-slate-200">
              {pendingPeriods.map((period, index) => {
              const periodTransactions = Array.isArray(period.transactions) ?
              period.transactions :
              [];
              const periodSubscriptionSales = Array.isArray(period.subscriptionSales) ?
              period.subscriptionSales :
              [];
              const isLocked = index > 0;

              return (
                <section key={period.id || period.periodStartAt} className="space-y-4 px-6 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900">
                            {formatPeriodDate(period.businessDate)}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            period.isAutoClosed ?
                            "bg-amber-100 text-amber-700" :
                            "bg-emerald-100 text-emerald-700"
                            }`}>

                            {period.isAutoClosed ? "À clôturer" : "Journée ouverte"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatPeriodRange(period)}
                        </p>
                      </div>
                      <div className="grid gap-3 text-sm sm:grid-cols-4 lg:min-w-[520px]">
                        <div>
                          <p className="text-xs text-slate-500">Montant</p>
                          <p className="font-semibold text-slate-900">{formatPrice(period.amount || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Ventes</p>
                          <p className="font-semibold text-slate-900">{period.bookingCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Billets</p>
                          <p className="font-semibold text-slate-900">{period.ticketCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Abonnements</p>
                          <p className="font-semibold text-slate-900">{period.subscriptionSaleCount || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:max-w-xs">
                      <CashRegisterCloseAction
                      staffId={details?.staff?.id}
                      disabled={isLocked}
                      pendingAmount={period.amount || 0}
                      pendingTickets={period.ticketCount || 0}
                      pendingSubscriptionSales={period.subscriptionSaleCount || 0}
                      periodStartAt={period.periodStartAt}
                      periodLabel={formatPeriodDate(period.businessDate)} />

                      {isLocked ?
                      <p className="text-xs text-slate-400">
                          Clôturez d&apos;abord la feuille la plus ancienne.
                        </p> :
                      null}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200">
                        <div className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Détail billets
                        </div>
                        <div className="divide-y divide-slate-100">
                          {periodTransactions.length === 0 ?
                          <div className="px-4 py-4 text-sm text-slate-500">Aucune vente billet.</div> :
                          periodTransactions.map((transaction) =>
                          <div key={transaction.bookingId || transaction.bookingNumber} className="px-4 py-3 text-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-slate-900">{transaction.bookingNumber || "-"}</p>
                                    <p className="text-xs text-slate-500">
                                      {transaction?.session?.eventName || "-"} • {formatDateTime(transaction.createdAt)}
                                    </p>
                                  </div>
                                  <p className="font-semibold text-slate-900">{formatPrice(transaction.totalAmount)}</p>
                                </div>
                                <div className="mt-2 text-xs text-slate-500">
                                  {transaction.ticketCount || 0} billet(s) • {formatTariffBreakdown(transaction.tariffBreakdown)}
                                </div>
                              </div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200">
                        <div className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Détail abonnements
                        </div>
                        <div className="divide-y divide-slate-100">
                          {periodSubscriptionSales.length === 0 ?
                          <div className="px-4 py-4 text-sm text-slate-500">Aucune vente abonnement.</div> :
                          periodSubscriptionSales.map((sale) =>
                          <div key={sale.subscriptionSaleId || sale.subscriptionCode} className="px-4 py-3 text-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-slate-900">{sale.subscriptionCode || "-"}</p>
                                    <p className="text-xs text-slate-500">
                                      {sale.subscriptionName || "-"} • {formatCustomerContact(sale.customerContact)}
                                    </p>
                                  </div>
                                  <p className="font-semibold text-slate-900">{formatPrice(sale.totalAmount)}</p>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">{formatDateTime(sale.createdAt)}</p>
                              </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>);
            })}
            </div>
          }
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Ventes billets
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Booking</th>
                  <th className="px-6 py-4 text-left font-semibold">Séance</th>
                  <th className="px-6 py-4 text-left font-semibold">Date</th>
                  <th className="px-6 py-4 text-left font-semibold">Billets</th>
                  <th className="px-6 py-4 text-left font-semibold">Tarifs</th>
                  <th className="px-6 py-4 text-left font-semibold">Promo</th>
                  <th className="px-6 py-4 text-left font-semibold">Abonnement</th>
                  <th className="px-6 py-4 text-left font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                {transactions.length === 0 ?
                <tr>
                    <td colSpan={8} className="px-6 py-8">
                      Aucune transaction ouverte dans cette caisse.
                    </td>
                  </tr> :

                transactions.map((transaction) =>
                <tr
                  key={transaction.bookingId || transaction.bookingNumber}
                  className="hover:bg-slate-50">

                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {transaction.bookingNumber || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div>{transaction?.session?.eventName || "-"}</div>
                        <div className="text-xs text-slate-500">
                          {formatSessionCell(transaction?.session)}
                        </div>
                      </td>
                      <td className="px-6 py-4">{formatDateTime(transaction.createdAt)}</td>
                      <td className="px-6 py-4">{transaction.ticketCount || 0}</td>
                      <td className="px-6 py-4">
                        {formatTariffBreakdown(transaction.tariffBreakdown)}
                      </td>
                      <td className="px-6 py-4">{formatPromotion(transaction.promotion)}</td>
                      <td className="px-6 py-4">
                        {transaction.usedSubscription ? "Oui" : "Non"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {formatPrice(transaction.totalAmount)}
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
              Ventes abonnements
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
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
                    <td colSpan={5} className="px-6 py-8">
                      Aucune vente d&apos;abonnement ouverte dans cette caisse.
                    </td>
                  </tr> :

                subscriptionSales.map((sale) =>
                <tr
                  key={sale.subscriptionSaleId || sale.subscriptionCode}
                  className="hover:bg-slate-50">

                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {sale.subscriptionCode || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div>{sale.subscriptionName || "-"}</div>
                        <div className="text-xs text-slate-500">
                          {sale.totalCredits || 0} crédit(s)
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {formatCustomerContact(sale.customerContact)}
                      </td>
                      <td className="px-6 py-4">
                        {formatDateTime(sale.createdAt)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {formatPrice(sale.totalAmount)}
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
