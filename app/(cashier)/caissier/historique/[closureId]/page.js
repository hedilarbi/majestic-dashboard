import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { formatDateTime, formatPrice } from "@/lib/configurations/formatters";
import { getCashierClosureDetails } from "@/services/cash-registers";

const formatTariffBreakdown = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return <span>-</span>;
  }

  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <div
          key={`${item.pricingName || "tarif"}-${item.price || 0}-${index}`}
          className="whitespace-nowrap"
        >
          {item.quantity} {item.pricingName} {formatPrice(item.price)}
        </div>
      ))}
    </div>
  );
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
        year: "numeric",
      }),
    );
  }
  if (session.sessionTime) {
    parts.push(session.sessionTime);
  }

  return parts.join(" • ") || "-";
};

const formatCustomerContact = (contact) => {
  const fullName = [contact?.firstName || "", contact?.lastName || ""]
    .join(" ")
    .trim();

  if (fullName && contact?.email) {
    return `${fullName} • ${contact.email}`;
  }

  return fullName || contact?.email || "-";
};

export default async function CashierClosureDetailsPage({ params }) {
  const resolvedParams = await params;
  const closureId = resolvedParams?.closureId;
  const { ok, closure, message } = await getCashierClosureDetails(closureId);

  if (!ok || !closure) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href="/caissier/historique"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
          aria-label="Retour a l'historique"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
        </Link>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {message || "Impossible de charger la clôture."}
        </div>
      </div>
    );
  }

  const transactions = Array.isArray(closure.transactions) ? closure.transactions : [];
  const subscriptionSales = Array.isArray(closure.subscriptionSales)
    ? closure.subscriptionSales
    : [];
  const ticketOfficeName =
    [closure?.ticketOffice?.firstName || "", closure?.ticketOffice?.lastName || ""]
      .join(" ")
      .trim() || closure?.ticketOffice?.email || "Guichet";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/caissier/historique"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
          aria-label="Retour a l'historique"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900">
            Clôture {ticketOfficeName}
          </h1>
          <p className="text-sm text-slate-500">{closure?.ticketOffice?.email || "-"}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Montant transféré
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {formatPrice(closure.amount)}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Ventes billets
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {closure.bookingCount || 0}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Billets
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {closure.ticketCount || 0}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Abonnements
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {closure.subscriptionSaleCount || 0}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Date
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-900">
            {formatDateTime(closure.closedAt)}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Période
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {formatDateTime(closure.periodStartAt)} → {formatDateTime(closure.periodEndAt)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Caissier
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {[closure?.cashier?.firstName || "", closure?.cashier?.lastName || ""]
                .join(" ")
                .trim() || closure?.cashier?.email || "-"}
            </p>
          </div>
        </div>
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
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8">
                    Aucun détail enregistré pour cette clôture.
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.bookingId || transaction.bookingNumber} className="hover:bg-slate-50">
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
                    <td className="px-6 py-4">{formatTariffBreakdown(transaction.tariffBreakdown)}</td>
                    <td className="px-6 py-4">{formatPromotion(transaction.promotion)}</td>
                    <td className="px-6 py-4">
                      {transaction.usedSubscription ? "Oui" : "Non"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatPrice(transaction.totalAmount)}
                    </td>
                  </tr>
                ))
              )}
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
              {subscriptionSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8">
                    Aucun abonnement dans cette clôture.
                  </td>
                </tr>
              ) : (
                subscriptionSales.map((sale) => (
                  <tr
                    key={sale.subscriptionSaleId || sale.subscriptionCode}
                    className="hover:bg-slate-50"
                  >
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
