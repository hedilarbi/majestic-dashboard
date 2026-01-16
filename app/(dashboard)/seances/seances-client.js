"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Icon } from "@/components/ui/icons";
import SessionsTable from "@/components/evenements/sessions-table";
import SessionFormModal from "@/components/evenements/session-form-modal";
import SeancesFilters from "@/components/seances/seances-filters";
import SeancesPagination from "@/components/seances/seances-pagination";

export default function SeancesClient({
  initialSessions = [],
  initialError = "",
  initialPagination = null,
  initialStatusFilter = "Tous",
  initialDateFrom = "",
  initialDateTo = "",
  events = [],
  eventsError = "",
  rooms = [],
  sessionTimes = [],
  pricing = [],
  roomsError = "",
  sessionTimesError = "",
  pricingError = "",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const pagination = initialPagination || {
    page: 1,
    limit: 10,
    total: null,
    totalPages: null,
    hasNext: false,
    hasPrev: false,
  };

  const statusParam =
    searchParams.get("status") || initialStatusFilter || "Tous";
  const dateFromParam = searchParams.get("from") || initialDateFrom || "";
  const dateToParam = searchParams.get("to") || initialDateTo || "";
  const filtersKey = useMemo(
    () => `${statusParam}|${dateFromParam}|${dateToParam}`,
    [dateFromParam, dateToParam, statusParam]
  );

  const updateSearchParams = (updates) => {
    const params = new URLSearchParams(searchParams.toString());

    if (Object.prototype.hasOwnProperty.call(updates, "status")) {
      const value = updates.status;
      if (value && value !== "Tous") {
        params.set("status", value);
      } else {
        params.delete("status");
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, "from")) {
      const value = updates.from;
      if (value) {
        params.set("from", value);
      } else {
        params.delete("from");
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, "to")) {
      const value = updates.to;
      if (value) {
        params.set("to", value);
      } else {
        params.delete("to");
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, "page")) {
      params.set("page", String(updates.page));
    }

    const nextQuery = params.toString();
    router.push(nextQuery ? `/seances?${nextQuery}` : "/seances");
  };

  const handleApplyFilters = ({ statusFilter, dateFrom, dateTo }) => {
    updateSearchParams({
      status: statusFilter,
      from: dateFrom,
      to: dateTo,
      page: 1,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-secondary text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
            Gestion des séances
          </h1>
          <p className="mt-1 text-slate-500">
            Planifiez et suivez les séances de votre programmation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary/90"
        >
          <Icon name="plus" className="h-5 w-5" />
          Créer une séance
        </button>
      </div>

      {initialError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {initialError}
        </div>
      ) : null}
      {eventsError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {eventsError}
        </div>
      ) : null}

      <SeancesFilters
        key={filtersKey}
        initialDateFrom={dateFromParam}
        initialDateTo={dateToParam}
        initialStatus={statusParam}
        onApply={handleApplyFilters}
      />

      <SessionsTable
        sessions={initialSessions}
        events={events}
        showEvent
        showRoom
        rooms={rooms}
        sessionTimes={sessionTimes}
        pricing={pricing}
        roomsError={roomsError}
        sessionTimesError={sessionTimesError}
        pricingError={pricingError}
      />

      <SeancesPagination
        page={pagination.page}
        limit={pagination.limit}
        total={pagination.total}
        totalPages={pagination.totalPages}
        hasNext={pagination.hasNext}
        hasPrev={pagination.hasPrev}
      />

      {isCreateOpen ? (
        <SessionFormModal
          mode="create"
          events={events}
          allowEventSelection
          event={events[0] || null}
          rooms={rooms}
          sessionTimes={sessionTimes}
          pricing={pricing}
          roomsError={roomsError}
          sessionTimesError={sessionTimesError}
          pricingError={pricingError}
          onClose={() => setIsCreateOpen(false)}
        />
      ) : null}
    </div>
  );
}
