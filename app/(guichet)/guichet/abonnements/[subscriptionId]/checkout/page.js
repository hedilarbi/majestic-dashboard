import Link from "next/link";

import GuichetSubscriptionCheckoutClient from "@/components/guichet/GuichetSubscriptionCheckoutClient";
import { Icon } from "@/components/ui/icons";
import { formatDate, formatPrice } from "@/lib/configurations/formatters";
import { getGuichetSubscriptionDetails } from "@/services/guichet-subscription-details";

const isSubscriptionAvailable = (subscription) => {
  if (
  !subscription ||
  subscription.isActive === false ||
  !subscription.expirationDate)
  {
    return false;
  }

  const expirationDate = new Date(subscription.expirationDate);
  if (Number.isNaN(expirationDate.getTime())) {
    return false;
  }

  return expirationDate.getTime() >= Date.now();
};

export default async function GuichetSubscriptionCheckoutPage({ params }) {
  const resolvedParams = await params;
  const subscriptionId = resolvedParams?.subscriptionId;
  const { ok, subscription, message } =
  await getGuichetSubscriptionDetails(subscriptionId);
  const isAvailable = isSubscriptionAvailable(subscription);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div>
          <Link
            href="/guichet/abonnements"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary bg-primary text-white shadow-sm transition hover:bg-primary/90"
            aria-label="Retour aux abonnements">

            <Icon name="chevronLeft" className="h-4 w-4" />
          </Link>
        </div>
        <div>
          <h1 className="text-slate-900 text-2xl md:text-3xl font-secondary font-semibold leading-tight tracking-tight">
            Checkout abonnement
          </h1>
        </div>
      </div>

      {!ok || !subscription || !isAvailable ?
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {message || "Cet abonnement n'est plus disponible."}
        </div> :

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <GuichetSubscriptionCheckoutClient
          subscriptionId={subscriptionId}
          subscription={subscription} />


          <aside className="lg:col-span-4">
            <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Resume
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900">
                {subscription.name}
              </h2>
              {subscription.description ?
            <p className="mt-3 text-sm leading-6 text-slate-500">
                  {subscription.description}
                </p> :
            null}

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Prix
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {formatPrice(subscription.price)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Credits inclus
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {subscription.totalCredits ?? "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Expiration
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {formatDate(subscription.expirationDate)}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      }
    </div>);

}
