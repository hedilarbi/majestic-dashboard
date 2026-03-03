import Link from "next/link";
import Image from "next/image";

import GuichetCheckoutClient from "@/components/guichet/GuichetCheckoutClient";
import { Icon } from "@/components/ui/icons";
import { getGuichetReservationDetails } from "@/services/guichet-reservation-details";
import {
  resolvePricingItems,
  resolveSeanceInfo,
} from "@/lib/guichet/seance-utils";

const FALLBACK_POSTER = "/images/logo.png";

const formatSeatLabel = (seat) => {
  if (!seat) {
    return "";
  }
  return `${seat.row}${seat.col}`;
};

export default async function CheckoutPage({ params }) {
  const { seanceId } = (await params) || {};
  const { ok, data, message } = await getGuichetReservationDetails(seanceId);

  const sessionData = data?.session || {};
  const seance = resolveSeanceInfo(data || {});
  const pricingItems = resolvePricingItems(data || {});
  const reservation = data?.reservation || null;
  const seats = Array.isArray(reservation?.seats) ? reservation.seats : [];
  const seatLabels = seats.map(formatSeatLabel).filter(Boolean);
  const poster = seance.poster || FALLBACK_POSTER;
  const roomLabel = sessionData?.room?.name || seance.room || "Salle";
  const pricingOverrides = [
    ...(Array.isArray(data?.pricingOverrides) ? data.pricingOverrides : []),
    ...(Array.isArray(sessionData?.pricingOverrides)
      ? sessionData.pricingOverrides
      : []),
    ...(Array.isArray(sessionData?.room?.pricingOverrides)
      ? sessionData.room.pricingOverrides
      : []),
    ...(Array.isArray(data?.room?.pricingOverrides)
      ? data.room.pricingOverrides
      : []),
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col gap-3">
        <div>
          <Link
            href={`/guichet/${seanceId}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
            aria-label="Retour à la séance"
          >
            <Icon name="chevronLeft" className="h-4 w-4" />
          </Link>
        </div>
        <div>
          <h1 className="text-slate-900 text-2xl md:text-3xl font-secondary font-semibold leading-tight tracking-tight">
            Configuration de vos billets
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <GuichetCheckoutClient
          ok={ok}
          message={message}
          reservation={reservation}
          seats={seats}
          pricingItems={pricingItems}
          pricingOverrides={pricingOverrides}
          sessionId={seanceId}
        />

        <aside className="lg:col-span-4">
          <div className="sticky top-24 flex flex-col gap-6 p-6 bg-white rounded-2xl border border-slate-100 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.3)]">
            <div className="relative aspect-[4/5] w-full rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 opacity-30" />
              <Image
                alt={`Affiche ${seance.title || "Séance"}`}
                className="w-full h-full object-cover"
                fill
                sizes="(min-width: 1024px) 320px, 100vw"
                src={poster}
              />
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-secondary text-slate-900 tracking-tight leading-none uppercase">
                  {seance.title || "Séance"}
                </h2>
                {seance.genre ? (
                  <p className="text-primary text-sm font-semibold">
                    {seance.genre}
                  </p>
                ) : null}
              </div>
              <hr className="border-slate-100" />
              <div className="flex flex-col gap-4 text-slate-600">
                <div className="flex items-center gap-3">
                  <Icon name="calendar" className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-slate-900">
                    {seance.date || "Date à venir"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="clock" className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-slate-900">
                    {seance.time || "Horaire"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Icon name="seat" className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-slate-900">
                    {roomLabel}
                    {seatLabels.length
                      ? `, sièges ${seatLabels.join(", ")}`
                      : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
