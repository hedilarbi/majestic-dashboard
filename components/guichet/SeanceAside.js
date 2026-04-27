import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { formatTimeLeft } from "@/lib/guichet/time-utils";
import { formatPrice } from "@/lib/configurations/formatters";

export default function SeanceAside({
  seance,
  pricingItems,
  fixedPricingGroups,
  myReservation,
  reservationExpired,
  timeLeftMs,
  isCancelling,
  checkoutHref,
  isActionPending,
  isActionDisabled,
  onCancelReservation,
}) {
  const safeSeance = seance || {};
  const items = pricingItems?.length ? pricingItems : [];
  const fixedGroups = fixedPricingGroups?.length ? fixedPricingGroups : [];

  const formatPricing = (value) => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    if (typeof value === "string" && /[a-z]/i.test(value)) {
      return value;
    }

    const numeric =
      typeof value === "number" ? value : Number.parseFloat(value);
    return Number.isFinite(numeric) ? formatPrice(numeric) : String(value);
  };

  return (
    <aside className="w-full lg:w-[360px] bg-white rounded-3xl border border-slate-200 p-6 lg:p-8 shadow-[0_24px_60px_-40px_rgba(16,52,166,0.45)]">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Informations séance
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex gap-5">
          <div
            className="w-24 h-36 shrink-0 rounded-xl bg-cover bg-center shadow-md border border-slate-100"
            style={{
              backgroundImage: safeSeance.poster
                ? `url(${safeSeance.poster})`
                : "none",
            }}
          />
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-secondary text-slate-900 leading-tight mb-3 uppercase">
              {safeSeance.title || "Séance"}
            </h1>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Icon name="calendar" className="h-4 w-4 text-primary" />
                <span>{safeSeance.date || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="clock" className="h-4 w-4 text-primary" />
                <span>{safeSeance.time || "-"}</span>
              </div>
              {/* <div className="flex items-center gap-2">
                <Icon name="seat" className="h-4 w-4 text-primary" />
                <span>{safeSeance.room}</span>
              </div> */}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-4">
            Tarifs disponibles
          </p>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id || item.name}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <div className="flex flex-col">
                  <span className="text-slate-900 font-semibold text-base">
                    {item.name}
                  </span>
                </div>
                <span className="text-base font-secondary text-slate-900">
                  {formatPricing(item.price)}
                </span>
              </div>
            ))}
            {!items.length ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-400">
                Aucun tarif disponible.
              </div>
            ) : null}
          </div>
        </div>

        {fixedGroups.length ? (
          <div className="pt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary mb-4">
              Tarifs fixes
            </p>
            <div className="space-y-3">
              {fixedGroups.map((group) => (
                <div
                  key={group.pricingId}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">
                      {group.label}
                    </span>
                    <span className="text-sm font-secondary text-slate-900">
                      {formatPricing(group.price)}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] font-semibold text-slate-500">
                    Sièges: {group.seats.join(", ")}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] font-semibold text-slate-500">
              Ces sièges ont un tarif imposé et ne peuvent pas être modifiés.
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100">
        {/* {myReservation ? (
          <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 flex items-center justify-between">
            <span>Réservation en cours</span>
            <span className="font-secondary text-slate-900">
              {formatTimeLeft(timeLeftMs)}
            </span>
          </div>
        ) : null} */}

        {reservationExpired ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
            Réservation expirée
          </div>
        ) : null}

        {myReservation ? (
          <button
            type="button"
            onClick={onCancelReservation}
            disabled={isCancelling || isActionPending}
            className="w-full mb-3 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold tracking-widest hover:border-primary hover:text-primary transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
        ) : null}

        {myReservation && !isActionDisabled ? (
          <Link
            href={checkoutHref}
            className="w-full py-4 rounded-xl bg-primary text-white font-semibold tracking-widest flex items-center justify-center gap-3 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
          >
            Valider la sélection
            <Icon name="chevronDown" className="h-4 w-4 rotate-[-90deg]" />
          </Link>
        ) : (
          <button
            type="button"
            disabled={isActionDisabled}
            className="w-full py-4 rounded-xl bg-primary text-white font-semibold tracking-widest flex items-center justify-center gap-3 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isActionPending ? "Mise à jour..." : "Valider la sélection"}
            <Icon name="chevronDown" className="h-4 w-4 rotate-[-90deg]" />
          </button>
        )}
      </div>
    </aside>
  );
}
