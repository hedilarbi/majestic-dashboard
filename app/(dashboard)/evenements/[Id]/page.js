import Image from "next/image";
import Link from "next/link";

import { Icon } from "@/components/ui/icons";
import EventEditTrigger from "@/components/evenements/event-edit-trigger";
import SessionModalTrigger from "@/components/evenements/session-modal-trigger";
import SessionsTable from "@/components/evenements/sessions-table";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  TYPE_LABELS,
  formatDate,
} from "@/lib/evenements/helpers";
import {
  getEventDetails,
  getEventSessions,
  getSessionFormData,
} from "@/services/evenements";
import { getShowTypes } from "@/services/show-types";

export default async function EventDetailsPage({ params }) {
  const resolvedParams = await params;
  const eventId = resolvedParams?.Id || resolvedParams?.id;

  if (!eventId) {
    return (
      <div className="max-w-4xl mx-auto rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
        Identifiant manquant.
      </div>
    );
  }

  const [
    { event, error },
    { sessions, error: sessionsError },
    {
      rooms,
      sessionTimes,
      pricing,
      roomsError,
      sessionTimesError,
      pricingError,
    },
    { items: showTypes, error: showTypesError },
  ] = await Promise.all([
    getEventDetails(eventId),
    getEventSessions(eventId),
    getSessionFormData(),
    getShowTypes(),
  ]);

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
        {error || "Événement introuvable."}
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[event.status] || STATUS_STYLES.active;
  const statusLabel = STATUS_LABELS[event.status] || event.status;
  const typeLabel = TYPE_LABELS[event.type] || event.type;
  const releaseLabel = event.releaseDate ? formatDate(event.releaseDate) : "-";
  const durationLabel =
    typeof event.duration === "number" ? `${event.duration} min` : "-";

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <nav className="flex flex-wrap items-center text-sm font-medium text-slate-500">
        <Link href="/" className="hover:text-primary transition-colors">
          Tableau de bord
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        <Link
          href="/evenements"
          className="hover:text-primary transition-colors"
        >
          Événements
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-900 font-semibold">{event.name}</span>
      </nav>

      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-80 xl:w-96 shrink-0">
          <div className="relative h-96 w-full overflow-hidden rounded-xl bg-slate-100 sm:h-[30rem]">
            {event.poster ? (
              <Image
                src={event.poster}
                alt={event.name}
                fill
                sizes="(min-width: 1280px) 384px, (min-width: 1024px) 320px, 80vw"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-primary text-3xl font-semibold">
                {event.name.slice(0, 1)}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ${statusStyle.badge}`}
              >
                <span
                  className={`size-1.5 rounded-full ${statusStyle.dot}`}
                ></span>
                {statusLabel}
              </span>
              <span className="text-sm text-accent font-semibold">
                Sortie {releaseLabel}
              </span>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-3xl lg:text-4xl font-bold text-primary">
                {event.name}
              </h1>
              <EventEditTrigger
                event={event}
                showTypes={showTypes}
                showTypesError={showTypesError}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <Icon name="clock" className="h-4 w-4" />
                {durationLabel}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{typeLabel}</span>
              {event.genres.length > 0 ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>{event.genres.join(", ")}</span>
                </>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">
                Synopsis
              </h2>
              <p className="text-slate-600 leading-relaxed">
                {event.description || "Aucune description disponible."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <p className="text-xs uppercase text-slate-400 font-semibold mb-1">
                  Réalisateur
                </p>
                <p className="text-slate-900 font-medium">
                  {event.directedBy || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400 font-semibold mb-1">
                  Distribution
                </p>
                <p className="text-slate-900 font-medium">
                  {event.cast.length > 0 ? event.cast.join(", ") : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400 font-semibold mb-1">
                  Versions
                </p>
                <div className="flex flex-wrap gap-2">
                  {event.availableVersions.length > 0
                    ? event.availableVersions.map((version) => (
                        <span
                          key={version}
                          className="px-2 py-0.5 rounded-full border border-slate-200 text-xs font-medium text-slate-600"
                        >
                          {version}
                        </span>
                      ))
                    : "-"}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400 font-semibold mb-1">
                  Restriction d&apos;âge
                </p>
                <p className="text-slate-900 font-medium">
                  {event.ageRestriction || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400 font-semibold mb-1">
                  Disponible du
                </p>
                <p className="text-slate-900 font-medium">
                  {event.availableFrom ? formatDate(event.availableFrom) : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400 font-semibold mb-1">
                  Disponible jusqu&apos;au
                </p>
                <p className="text-slate-900 font-medium">
                  {event.availableTo ? formatDate(event.availableTo) : "-"}
                </p>
              </div>
              {event.trailerLink ? (
                <div>
                  <p className="text-xs uppercase text-slate-400 font-semibold mb-1">
                    Trailer
                  </p>
                  <a
                    href={event.trailerLink}
                    className="text-primary font-medium hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Voir le trailer
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-primary">
              Séances programmées
            </h2>
            <p className="text-sm text-accent">
              Liste des séances reliées à cet événement.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Icon name="filter" className="h-4 w-4" />
              Filtrer
            </button>
            <SessionModalTrigger
              label="Ajouter une séance"
              event={event}
              rooms={rooms}
              sessionTimes={sessionTimes}
              pricing={pricing}
              roomsError={roomsError}
              sessionTimesError={sessionTimesError}
              pricingError={pricingError}
            />
          </div>
        </div>

        {sessionsError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {sessionsError}
          </div>
        ) : null}

        <SessionsTable
          sessions={sessions}
          eventId={eventId}
          event={event}
          rooms={rooms}
          sessionTimes={sessionTimes}
          pricing={pricing}
          roomsError={roomsError}
          sessionTimesError={sessionTimesError}
          pricingError={pricingError}
        />
      </section>
    </div>
  );
}
