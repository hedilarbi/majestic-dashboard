import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import { getGuichetSessions } from "@/services/guichet-sessions";

const formatNumber = (value) => new Intl.NumberFormat("fr-FR").format(value);

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getQueryString = ({ nom, dateFrom, dateTo, includeDates = true }) => {
  const params = new URLSearchParams();

  if (nom) {
    params.set("nom", nom);
  }

  if (includeDates && dateFrom) {
    params.set("dateFrom", dateFrom);
  }

  if (includeDates && dateTo) {
    params.set("dateTo", dateTo);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
};

export default async function VenteDeBilletPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const nom =
    typeof resolvedParams?.nom === "string" ? resolvedParams.nom.trim() : "";
  const rawDateFrom =
    typeof resolvedParams?.dateFrom === "string" ? resolvedParams.dateFrom : "";
  const rawDateTo =
    typeof resolvedParams?.dateTo === "string" ? resolvedParams.dateTo : "";
  const hasDateFilter = Boolean(rawDateFrom || rawDateTo);

  const today = new Date();
  const todayValue = formatDateInput(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowValue = formatDateInput(tomorrow);

  const appliedDateFrom = hasDateFilter ? rawDateFrom || rawDateTo : todayValue;
  const appliedDateTo = hasDateFilter ? rawDateTo || rawDateFrom : todayValue;

  const { items: sessions, error } = await getGuichetSessions({
    dateFrom: appliedDateFrom,
    dateTo: appliedDateTo,
    nom,
  });

  const isTodayActive =
    appliedDateFrom === todayValue && appliedDateTo === todayValue;
  const isTomorrowActive =
    appliedDateFrom === tomorrowValue && appliedDateTo === tomorrowValue;
  const rangeLabel =
    appliedDateFrom && appliedDateTo
      ? `${formatDisplayDate(appliedDateFrom)} - ${formatDisplayDate(
          appliedDateTo,
        )}`
      : "Intervalle de dates";

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="font-secondary text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight uppercase">
              Sélection de la séance
            </h1>
            <p className="text-slate-500 mt-2">
              Recherchez un film ou filtrez par date pour initier la vente.
            </p>
          </div>
          <form className="w-full md:w-96" method="get">
            {hasDateFilter ? (
              <input type="hidden" name="dateFrom" value={appliedDateFrom} />
            ) : null}
            {hasDateFilter ? (
              <input type="hidden" name="dateTo" value={appliedDateTo} />
            ) : null}
            <div className="relative group">
              <Icon
                name="search"
                className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
              />
              <input
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium outline-none shadow-sm"
                placeholder="Rechercher par nom de film..."
                type="text"
                name="nom"
                defaultValue={nom}
              />
            </div>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-200">
          <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
            <Link
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                isTodayActive
                  ? "bg-primary text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
              href={`/guichet/vente-de-billet${getQueryString({
                nom,
                includeDates: false,
              })}`}
            >
              Aujourd&apos;hui
            </Link>
            <Link
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
                isTomorrowActive
                  ? "bg-primary text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
              href={`/guichet/vente-de-billet${getQueryString({
                nom,
                dateFrom: tomorrowValue,
                dateTo: tomorrowValue,
              })}`}
            >
              Demain
            </Link>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <form className="flex flex-wrap items-center gap-2" method="get">
              {nom ? <input type="hidden" name="nom" value={nom} /> : null}
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:text-primary transition-colors text-slate-700">
                <Icon name="calendar" className="h-4 w-4" />
                <span className="text-xs font-semibold">{rangeLabel}</span>
              </div>
              <input
                type="date"
                name="dateFrom"
                defaultValue={hasDateFilter ? appliedDateFrom : ""}
                className="h-9 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <span className="text-slate-300 text-xs">→</span>
              <input
                type="date"
                name="dateTo"
                defaultValue={hasDateFilter ? appliedDateTo : ""}
                className="h-9 rounded-lg border border-slate-200 px-2 text-xs font-semibold text-slate-600 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                className="h-9 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:border-primary hover:text-primary transition"
              >
                Appliquer
              </button>
            </form>
          </div>

          <div className="flex-1" />

          <Link
            href={`/guichet/vente-de-billet${getQueryString({
              nom,
              dateFrom: hasDateFilter ? appliedDateFrom : "",
              dateTo: hasDateFilter ? appliedDateTo : "",
              includeDates: hasDateFilter,
            })}`}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-primary transition-all shadow-sm"
          >
            <Icon name="swap" className="h-4 w-4" />
            <span>Actualiser</span>
          </Link>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sessions.length ? (
          sessions.map((session) => {
            const totalSeats = session.totalSeats ?? null;
            const availableSeats = session.availableSeats ?? null;
            const computedSold =
              Number.isFinite(totalSeats) && Number.isFinite(availableSeats)
                ? Math.max(totalSeats - availableSeats, 0)
                : null;
            const percent =
              session.occupancy ??
              (Number.isFinite(totalSeats) && Number.isFinite(computedSold)
                ? Math.round((computedSold / totalSeats) * 100)
                : 0);
            const isFull = percent >= 100 || availableSeats === 0;
            const poster = session.eventPoster;

            return (
              <article
                key={session.id}
                className={`flex flex-col border border-slate-200 rounded-2xl overflow-hidden transition-all ${
                  isFull
                    ? "bg-slate-50/80 opacity-80"
                    : "bg-white hover:border-primary/40 shadow-[0_14px_40px_-28px_rgba(16,52,166,0.45)]"
                }`}
              >
                <div className="flex p-5 gap-5">
                  <div
                    className={`w-24 shrink-0 bg-center bg-no-repeat aspect-[2/3] bg-cover rounded-xl shadow-md ${
                      isFull ? "grayscale" : ""
                    }`}
                    style={{
                      backgroundImage: poster
                        ? `url(${poster})`
                        : "linear-gradient(135deg, rgba(16,52,166,0.2), rgba(116,208,241,0.15))",
                    }}
                  />
                  <div className="flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-slate-900 text-lg font-secondary font-semibold leading-tight uppercase">
                          {session.eventName || "Séance"}
                        </h2>
                        {session.format ? (
                          <span className="shrink-0 bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-md font-semibold border border-primary/20 uppercase tracking-tight">
                            {session.format}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Icon name="clock" className="h-4 w-4 text-primary" />
                          <p className="text-sm font-semibold text-slate-900">
                            {session.timeLabel}
                          </p>
                        </div>
                        {/* <div className="flex items-center gap-2 text-slate-500">
                          <Icon name="seat" className="h-4 w-4" />
                          <p className="text-xs font-semibold">
                            {session.roomName || "Salle"}{" "}
                            {Number.isFinite(totalSeats)
                              ? `• ${formatNumber(totalSeats)} places`
                              : ""}
                          </p>
                        </div> */}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex flex-col">
                        <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                          {isFull ? "Statut" : "Vendus"}
                        </p>
                        <p
                          className={`text-sm font-semibold ${
                            isFull
                              ? "text-red-600"
                              : percent > 85
                                ? "text-amber-600"
                                : "text-emerald-600"
                          }`}
                        >
                          {isFull
                            ? "Complet"
                            : Number.isFinite(computedSold) &&
                                Number.isFinite(totalSeats)
                              ? `${formatNumber(computedSold)} / ${formatNumber(
                                  totalSeats,
                                )}`
                              : `${percent}%`}
                        </p>
                      </div>
                      <div className="h-1.5 flex-1 mx-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isFull
                              ? "bg-red-500"
                              : percent > 85
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  {isFull ? (
                    <button
                      className="w-full py-3.5 rounded-xl text-sm font-semibold tracking-widest flex items-center justify-center gap-2 bg-slate-200 text-slate-500 cursor-not-allowed"
                      disabled
                    >
                      INDISPONIBLE
                    </button>
                  ) : (
                    <Link
                      href={`/guichet/${session.id}`}
                      className="w-full py-3.5 rounded-xl text-sm font-semibold tracking-widest flex items-center justify-center gap-2 bg-primary text-white hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                      SÉLECTIONNER
                    </Link>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white/80 p-10 text-center text-sm text-slate-500">
            Aucune séance trouvée pour ces critères.
          </div>
        )}
      </section>
    </div>
  );
}
