import Link from "next/link";

import DashboardAccessDenied from "@/components/dashboard/access-denied";
import { Icon } from "@/components/ui/icons";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import { getReservationRequests } from "@/services/reservation-requests";

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const ESTABLISHMENT_TYPE_LABELS = {
  association: "Association",
  organisation: "Organisation",
};

export default async function ReservationRequestsPage() {
  const canList = await canAccessDashboardPermission(
    "reservation_requests",
    "list",
  );

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les demandes de réservation." />
    );
  }

  const { items, error } = await getReservationRequests();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          Demandes de réservation
        </h1>
        <p className="text-sm text-slate-500">
          Suivez les demandes de réservation d&apos;espace envoyées depuis le
          site client.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Demandeur</th>
                <th className="px-6 py-4 text-left font-semibold">
                  Etablissement
                </th>
                <th className="px-6 py-4 text-left font-semibold">
                  Date souhaitee
                </th>
                <th className="px-6 py-4 text-left font-semibold">Statut</th>
                <th className="px-6 py-4 text-left font-semibold">Créée le</th>
                <th className="px-6 py-4 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8">
                    Aucune demande pour le moment.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const fullName = `${item.firstName || ""} ${
                    item.lastName || ""
                  }`.trim();

                  return (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {fullName || "-"}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {item.email || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {ESTABLISHMENT_TYPE_LABELS[item.establishmentType] ||
                          item.establishmentType ||
                          "-"}
                      </td>
                      <td className="px-6 py-4">
                        {formatDateTime(item.reservationDateTime)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === "processed"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.status === "processed" ? "Traitee" : "En attente"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/demandes-reservation/${item._id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-primary"
                          aria-label="Voir le detail de la demande"
                          title="Voir le detail"
                        >
                          <Icon name="eye" className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
