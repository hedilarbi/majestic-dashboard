import { formatDateTime, formatPrice } from "@/lib/configurations/formatters";
import { getTicketOfficeOwnRegisterDetails } from "@/services/cash-registers";

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

export default async function GuichetCaissePage() {
  const { ok, details: details, message } = await getTicketOfficeOwnRegisterDetails();

  if (!ok || !details) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">Caisse</h1>
          <p className="text-sm text-slate-500">
            Suivi des ventes actuellement ouvertes dans cette caisse.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {message || "Impossible de charger la caisse."}
        </div>
      </div>);

  }

  const pendingPeriods = Array.isArray(details.pendingPeriods) ?
  details.pendingPeriods :
  [];
  const currentPeriod = pendingPeriods.find((period) => !period?.isAutoClosed) || null;
  const periodsToClose = pendingPeriods.filter((period) => period?.isAutoClosed);
  const hasPeriodData = pendingPeriods.length > 0;
  const transactions = hasPeriodData ?
  Array.isArray(currentPeriod?.transactions) ? currentPeriod.transactions : [] :
  Array.isArray(details.transactions) ? details.transactions : [];
  const subscriptionSales = hasPeriodData ?
  Array.isArray(currentPeriod?.subscriptionSales) ? currentPeriod.subscriptionSales : [] :
  Array.isArray(details.subscriptionSales) ? details.subscriptionSales : [];
  const currentBalance = hasPeriodData ?
  {
    amount: currentPeriod?.amount || 0,
    bookingCount: currentPeriod?.bookingCount || 0,
    ticketCount: currentPeriod?.ticketCount || 0,
    subscriptionSaleCount: currentPeriod?.subscriptionSaleCount || 0,
  } :
  details?.currentBalance || {
    amount: 0,
    bookingCount: 0,
    ticketCount: 0,
    subscriptionSaleCount: 0,
  };
  const currentAmount = currentBalance.amount || 0;
  const currentTickets = currentBalance.ticketCount || 0;

  const totalPendingToClose = periodsToClose.reduce(
    (total, period) => total + (period?.amount || 0),
    0
  );

  const pendingTicketsToClose = periodsToClose.reduce(
    (total, period) => total + (period?.ticketCount || 0),
    0
  );

  const pendingSubscriptionsToClose = periodsToClose.reduce(
    (total, period) => total + (period?.subscriptionSaleCount || 0),
    0
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Caisse</h1>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
	          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
	            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
	              Caisse du jour
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
	              {currentBalance.bookingCount || 0}
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
	              {currentBalance.subscriptionSaleCount || 0}
	            </p>
	          </div>
	        </div>

	        {periodsToClose.length > 0 ? (
	          <div className="overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm">
	            <div className="flex flex-col gap-2 border-b border-amber-100 bg-amber-50 px-6 py-4 md:flex-row md:items-center md:justify-between">
	              <div>
	                <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-700">
	                  Feuilles à clôturer
	                </h2>
	                <p className="mt-1 text-xs text-amber-700/80">
	                  Les journées passées sont fermées automatiquement à minuit et restent à clôturer par le caissier.
	                </p>
	              </div>
	              <div className="text-sm font-semibold text-amber-900">
	                {formatPrice(totalPendingToClose)} • {pendingTicketsToClose} billet(s) • {pendingSubscriptionsToClose} abonnement(s)
	              </div>
	            </div>
	            <div className="overflow-x-auto">
	              <table className="min-w-full divide-y divide-slate-200 text-sm">
	                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
	                  <tr>
	                    <th className="px-6 py-4 text-left font-semibold">Date</th>
	                    <th className="px-6 py-4 text-left font-semibold">Période</th>
	                    <th className="px-6 py-4 text-left font-semibold">Ventes</th>
	                    <th className="px-6 py-4 text-left font-semibold">Billets</th>
	                    <th className="px-6 py-4 text-left font-semibold">Abonnements</th>
	                    <th className="px-6 py-4 text-left font-semibold">Montant</th>
	                    <th className="px-6 py-4 text-left font-semibold">Statut</th>
	                  </tr>
	                </thead>
	                <tbody className="divide-y divide-slate-200 text-slate-600">
	                  {periodsToClose.map((period) =>
	                  <tr key={period.id || period.periodStartAt} className="hover:bg-slate-50">
	                      <td className="px-6 py-4 font-semibold text-slate-900">
	                        {formatPeriodDate(period.businessDate)}
	                      </td>
	                      <td className="px-6 py-4">{formatPeriodRange(period)}</td>
	                      <td className="px-6 py-4">{period.bookingCount || 0}</td>
	                      <td className="px-6 py-4">{period.ticketCount || 0}</td>
	                      <td className="px-6 py-4">{period.subscriptionSaleCount || 0}</td>
	                      <td className="px-6 py-4 font-semibold text-slate-900">
	                        {formatPrice(period.amount || 0)}
	                      </td>
	                      <td className="px-6 py-4">
	                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
	                          À clôturer
	                        </span>
	                      </td>
	                    </tr>
	                  )}
	                </tbody>
	              </table>
	            </div>
	          </div>
	        ) : null}

	        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
	          <div className="border-b border-slate-200 px-6 py-4">
	            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
	              Ventes billets du jour
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
                  <th className="px-6 py-4 text-left font-semibold">
                    Abonnement
                  </th>
                  <th className="px-6 py-4 text-left font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-600">
                {transactions.length === 0 ?
                <tr>
	                    <td colSpan={8} className="px-6 py-8">
	                      Aucune transaction ouverte dans la caisse du jour.
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
                      <td className="px-6 py-4">
                        {formatDateTime(transaction.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        {transaction.ticketCount || 0}
                      </td>
                      <td className="px-6 py-4">
                        {formatTariffBreakdown(transaction.tariffBreakdown)}
                      </td>
                      <td className="px-6 py-4">
                        {formatPromotion(transaction.promotion)}
                      </td>
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
	              Ventes abonnements du jour
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
	                      Aucune vente d&apos;abonnement ouverte dans la caisse du jour.
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
