import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { formatDate, formatPrice } from "@/lib/configurations/formatters";
import { getSubscriptions } from "@/services/subscriptions";

const isActiveSubscription = (item) => {
  if (!item || item.isActive === false || !item.expirationDate) {
    return false;
  }

  const expirationDate = new Date(item.expirationDate);
  if (Number.isNaN(expirationDate.getTime())) {
    return false;
  }

  return expirationDate.getTime() >= Date.now();
};

export default async function GuichetSubscriptionsPage() {
  const { items, error } = await getSubscriptions();
  const subscriptions = items.filter(isActiveSubscription);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Abonnements</h1>
        <p className="text-sm text-slate-500">
          Choisissez une formule et passez a la vente guichet.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {subscriptions.map((subscription) => (
          <article
            key={subscription.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  Abonnement
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {subscription.name}
                </h2>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Icon name="ticket" className="h-6 w-6" />
              </div>
            </div>

            {subscription.description ? (
              <p className="mt-4 text-sm leading-6 text-slate-500">
                {subscription.description}
              </p>
            ) : null}

            <div className="mt-5 space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span>Prix</span>
                <span className="font-semibold text-slate-900">
                  {formatPrice(subscription.price)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span>Credits</span>
                <span className="font-semibold text-slate-900">
                  {subscription.totalCredits ?? "-"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span>Expiration</span>
                <span className="font-semibold text-slate-900">
                  {formatDate(subscription.expirationDate)}
                </span>
              </div>
            </div>

            <Link
              href={`/guichet/abonnements/${subscription.id}/checkout`}
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Vendre cet abonnement
            </Link>
          </article>
        ))}
      </div>

      {!subscriptions.length && !error ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
          Aucun abonnement actif disponible pour le moment.
        </div>
      ) : null}
    </div>
  );
}
