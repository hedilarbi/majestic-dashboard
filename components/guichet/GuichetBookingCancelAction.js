"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ConfirmModal from "@/components/ui/confirm-modal";
import Toast from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

export default function GuichetBookingCancelAction({
  bookingId,
  ticketIds = [],
  label,
  description,
  className = "",
  disabled = false,
}) {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleConfirm = async () => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/guichet/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticketIds }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data?.message || "Annulation impossible.");
        return;
      }

      setIsOpen(false);
      showToast("Annulation effectuée.");
      router.refresh();
    } catch {
      setErrorMessage("Annulation impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => {
          setErrorMessage("");
          setIsOpen(true);
        }}
        disabled={disabled || isSubmitting || !bookingId || ticketIds.length === 0}
        className={className}
      >
        {isSubmitting ? "Annulation..." : label}
      </button>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {isOpen ? (
        <ConfirmModal
          title="Confirmer l'annulation"
          description={description}
          confirmLabel={isSubmitting ? "Annulation..." : "Confirmer"}
          isLoading={isSubmitting}
          onConfirm={handleConfirm}
          onCancel={() => {
            if (!isSubmitting) {
              setIsOpen(false);
            }
          }}
        />
      ) : null}

      <Toast toast={toast} />
    </div>
  );
}
