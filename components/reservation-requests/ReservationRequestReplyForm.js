"use client";

import { useState } from "react";
import { sendReservationRequestReply } from "@/services/reservation-requests-actions";

export default function ReservationRequestReplyForm({ requestId, recipientEmail, recipientName }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!subject.trim() || !message.trim()) {
      setErrorMessage("Le sujet et le message sont requis.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await sendReservationRequestReply(requestId, { subject, message });
      if (!result?.ok) {
        setErrorMessage(result?.message || "Envoi impossible.");
        return;
      }
      setSuccessMessage(`Email envoyé avec succès à ${recipientEmail}.`);
      setSubject("");
      setMessage("");
    } catch {
      setErrorMessage("Une erreur est survenue. Merci de réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm space-y-4">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-blue-800">
          Répondre par email
        </h2>
        <p className="mt-1 text-xs text-blue-600">
          Un email sera envoyé directement à{" "}
          <span className="font-semibold">{recipientName || recipientEmail}</span>{" "}
          ({recipientEmail}).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label
            htmlFor="reply-subject"
            className="block text-xs font-semibold text-blue-700 mb-1"
          >
            Objet
          </label>
          <input
            id="reply-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex: Réponse à votre demande de réservation d'espace"
            className="w-full rounded-xl border border-blue-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label
            htmlFor="reply-message"
            className="block text-xs font-semibold text-blue-700 mb-1"
          >
            Message
          </label>
          <textarea
            id="reply-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="Rédigez votre réponse ici..."
            className="w-full rounded-xl border border-blue-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 resize-y"
            disabled={isSubmitting}
          />
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Envoi en cours...
            </>
          ) : (
            "Envoyer la réponse"
          )}
        </button>
      </form>
    </div>
  );
}
