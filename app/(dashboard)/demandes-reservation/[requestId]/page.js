import Link from "next/link";

import DashboardAccessDenied from "@/components/dashboard/access-denied";
import ReservationRequestStatusAction from "@/components/reservation-requests/ReservationRequestStatusAction";
import ReservationRequestReplyForm from "@/components/reservation-requests/ReservationRequestReplyForm";
import { Icon } from "@/components/ui/icons";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import { getReservationRequestDetails } from "@/services/reservation-requests";

const ESTABLISHMENT_TYPE_LABELS = {
  association: "Association",
  organisation: "Organisation",
};

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

const formatActor = (value) => {
  if (!value || typeof value !== "object") {
    return "-";
  }

  const fullName = `${value.firstName || ""} ${value.lastName || ""}`.trim();
  return fullName || value.email || "-";
};

export default async function ReservationRequestDetailsPage({ params }) {
  const canList = await canAccessDashboardPermission(
    "reservation_requests",
    "list",
  );

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter cette demande." />
    );
  }

  const canUpdate = await canAccessDashboardPermission(
    "reservation_requests",
    "update",
  );
  const resolvedParams = await params;
  const requestId = resolvedParams?.requestId;
  const { item, error } = await getReservationRequestDetails(requestId);

  if (!item) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/demandes-reservation"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
          aria-label="Retour"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
        </Link>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {error || "Impossible de charger la demande."}
        </div>
      </div>
    );
  }

  const fullName = `${item.firstName || ""} ${item.lastName || ""}`.trim();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/demandes-reservation"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
          aria-label="Retour"
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900">
            Detail de la demande
          </h1>
          <p className="text-sm text-slate-500">{fullName || item.email}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Email
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {item.email || "-"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Telephone
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {item.phone || "-"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Etablissement
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {ESTABLISHMENT_TYPE_LABELS[item.establishmentType] ||
              item.establishmentType ||
              "-"}
          </p>
        </div>
        {item.organisationName ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Organisation
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {item.organisationName}
            </p>
          </div>
        ) : null}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Statut
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {item.status === "processed" ? "Traitee" : "En attente"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Date souhaitee
          </p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {formatDateTime(item.reservationDateTime)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Créée le
          </p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {formatDateTime(item.createdAt)}
          </p>
          {item.status === "processed" ? (
            <p className="mt-3 text-sm text-slate-500">
              Traitee le {formatDateTime(item.processedAt)} par{" "}
              <span className="font-semibold text-slate-700">
                {formatActor(item.processedBy)}
              </span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Description
        </p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
          {item.description || "-"}
        </p>
      </div>

      {canUpdate ? (
        <div className="grid gap-4 md:grid-cols-2">
          <ReservationRequestStatusAction
            requestId={item._id}
            isProcessed={item.status === "processed"}
          />
          <ReservationRequestReplyForm
            requestId={item._id}
            recipientEmail={item.email}
            recipientName={fullName || item.email}
          />
        </div>
      ) : null}
    </div>
  );
}
