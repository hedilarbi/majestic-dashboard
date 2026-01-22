"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/components/ui/icons";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  TYPE_LABELS,
  TYPE_STYLES,
  formatDate,
} from "@/lib/evenements/helpers";
import { updateEventStatus } from "@/services/evenements-actions";

export default function EventTable({ events, onDelete }) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState("");

  const handleToggleStatus = async (eventItem) => {
    if (!eventItem?.id) {
      return;
    }

    const nextStatus = eventItem.status === "active" ? "inactive" : "active";

    setUpdatingId(eventItem.id);

    try {
      const result = await updateEventStatus({
        id: eventItem.id,
        status: nextStatus,
      });

      if (result.ok) {
        router.refresh();
      }
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Détails de l&apos;événement
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Genres
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Date de sortie
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-600">
            {events.length === 0 ? (
              <tr>
                <td className="px-6 py-10 text-sm text-slate-500" colSpan={7}>
                  Aucun événement trouvé.
                </td>
              </tr>
            ) : (
              events.map((eventItem) => {
                const statusStyle =
                  STATUS_STYLES[eventItem.status] || STATUS_STYLES.active;
                const typeStyle =
                  TYPE_STYLES[eventItem.type] || TYPE_STYLES.movie;
                const typeLabel = TYPE_LABELS[eventItem.type] || eventItem.type;
                const statusLabel =
                  STATUS_LABELS[eventItem.status] || eventItem.status;
                const genresLabel =
                  Array.isArray(eventItem.genres) && eventItem.genres.length > 0
                    ? eventItem.genres.join(", ")
                    : "-";
                const shortId = eventItem.id.slice(-6).toUpperCase();

                return (
                  <tr
                    key={eventItem.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="relative size-14 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center text-primary font-semibold">
                          {eventItem.poster ? (
                            <Image
                              src={eventItem.poster}
                              alt={eventItem.name}
                              fill
                              sizes="56px"
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            eventItem.name.slice(0, 1)
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-slate-900">
                            {eventItem.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            ID: #{shortId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeStyle}`}
                      >
                        {typeLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {genresLabel}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(eventItem.releaseDate)}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={eventItem.status === "active"}
                        onClick={() => handleToggleStatus(eventItem)}
                        disabled={updatingId === eventItem.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          eventItem.status === "active"
                            ? "bg-emerald-500"
                            : "bg-slate-300"
                        } ${
                          updatingId === eventItem.id
                            ? "cursor-not-allowed opacity-70"
                            : "hover:opacity-90"
                        }`}
                        aria-label="Basculer le statut"
                      >
                        <span
                          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
                            eventItem.status === "active"
                              ? "translate-x-5"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/evenements/${eventItem.id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          aria-label="Voir l'événement"
                        >
                          <Icon name="eye" className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(eventItem)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                          aria-label="Supprimer l'événement"
                        >
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
