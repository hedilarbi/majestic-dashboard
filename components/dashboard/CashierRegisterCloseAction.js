"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ConfirmModal from "@/components/ui/confirm-modal";
import Toast from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/configurations/formatters";
import { closeCashierRegister } from "@/services/cash-register-actions";

export default function CashierRegisterCloseAction({
  staffId,
  disabled = false,
  pendingAmount = 0,
  transferCount = 0,
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
      const result = await closeCashierRegister(staffId);

      if (!result?.ok) {
        setErrorMessage(result?.message || "Clôture impossible.");
        return;
      }

      setIsOpen(false);
      showToast("Caisse caissier clôturée.");

      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
        return;
      }

      router.push("/caisse");
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
        disabled={disabled || isSubmitting}
        className="inline-flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Clôture..." : "Fermer la caisse"}
      </button>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {isOpen ? (
        <ConfirmModal
          title="Fermer la caisse du caissier"
          description={`Cette action transfère ${formatPrice(pendingAmount)} issus de ${transferCount} clôture(s) guichet.`}
          confirmLabel={isSubmitting ? "Clôture..." : "Confirmer"}
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
