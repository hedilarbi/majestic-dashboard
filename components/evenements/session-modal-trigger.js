"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/icons";
import { useDashboardModulePermissions } from "@/hooks/use-dashboard-permissions";
import SessionFormModal from "./session-form-modal";

export default function SessionModalTrigger({
  label,
  event,
  rooms,
  sessionTimes,
  pricing,
  roomsError,
  sessionTimesError,
  pricingError,
}) {
  const permissions = useDashboardModulePermissions("sessions");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {permissions.canCreate ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary/90"
        >
          <Icon name="plus" className="h-4 w-4" />
          {label}
        </button>
      ) : null}
      {isOpen && permissions.canCreate ? (
        <SessionFormModal
          event={event}
          rooms={rooms}
          sessionTimes={sessionTimes}
          pricing={pricing}
          roomsError={roomsError}
          sessionTimesError={sessionTimesError}
          pricingError={pricingError}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </>
  );
}
