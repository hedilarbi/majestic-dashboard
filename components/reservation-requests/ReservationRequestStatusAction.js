"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { markReservationRequestProcessed } from "@/services/reservation-requests-actions";

export default function ReservationRequestStatusAction({
  requestId,
  isProcessed = false,
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleMarkProcessed = async () => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await markReservationRequestProcessed(requestId);

      if (!result?.ok) {
        setErrorMessage(result?.message || "Mise à jour impossible.");
        return;
      }

      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {isProcessed ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Cette demande a déjà ete traitee.
        </div>
      ) : (
        <button
          type="button"
          onClick={handleMarkProcessed}
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Traitement..." : "Marquer comme traite"}
        </button>
      )}

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
