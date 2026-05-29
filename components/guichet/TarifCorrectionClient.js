"use client";

import { useState, useRef } from "react";
import { Icon } from "@/components/ui/icons";

// ─── Ticket Print Card (format ticket thermique 79mm) ────────────────────────
function TicketPrintCard({ ticket, booking }) {
  const eventName = ticket.eventName || "";
  const dateStr = ticket.sessionDate
    ? new Date(ticket.sessionDate).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "–";
  const timeStr = ticket.sessionTime || "";

  return (
    <article className="guichet-ticket-print-sheet relative mx-auto flex h-[123mm] min-h-[123mm] w-[79mm] min-w-[79mm] max-w-[79mm] flex-col rounded-md border border-slate-300 bg-white px-4 py-4 text-center text-black shadow-sm">
      <div className="flex flex-col items-center gap-0.5">
        <p className="text-[8px] font-semibold uppercase tracking-widest text-slate-400">
          MAJESTIC CINÉMA
        </p>
        <h2 className="text-[11px] font-bold uppercase leading-tight">{eventName}</h2>
      </div>
      <div className="my-2 h-px w-full bg-slate-200" />
      <div className="flex flex-1 flex-col justify-center gap-1.5 text-[10px]">
        <div className="flex justify-between">
          <span className="text-slate-500">Date</span>
          <span className="font-semibold">{dateStr}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Séance</span>
          <span className="font-semibold">{timeStr}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Siège</span>
          <span className="font-semibold">
            {ticket.seat?.row}-{ticket.seat?.col}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Tarif</span>
          <span className="font-semibold">{ticket.pricingName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Prix</span>
          <span className="font-bold">{Number(ticket.price).toFixed(3)} DT</span>
        </div>
      </div>
      <div className="my-2 h-px w-full border-t border-dashed border-slate-300" />
      <div className="flex flex-col items-center gap-1">
        <p className="font-mono text-[8px] tracking-widest text-slate-500">{ticket.code}</p>
        <p className="text-[7px] text-slate-400">BILLET CORRIGÉ</p>
      </div>
    </article>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatPrice = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "–";
  return `${num.toFixed(3)} DT`;
};

const formatDate = (value) => {
  if (!value) return "–";
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Espèces" },
  { value: "card", label: "Carte bancaire" },
];

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = ["Recherche", "Correction", "Confirmation"];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const num = i + 1;
        const isActive = step === num;
        const isDone = step > num;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/40"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {isDone ? <Icon name="check" className="h-4 w-4" /> : num}
              </div>
              <span
                className={`mt-1.5 text-xs font-semibold whitespace-nowrap ${
                  isActive ? "text-primary" : isDone ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${
                  isDone ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────
function TicketCard({ ticket }) {
  const statusColors = {
    active: "bg-emerald-100 text-emerald-700",
    scanned: "bg-amber-100 text-amber-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const statusLabels = { active: "Actif", scanned: "Scanné", cancelled: "Annulé" };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Billet</p>
          <p className="mt-1 font-mono text-lg font-bold text-slate-900">{ticket.code}</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            statusColors[ticket.status] || "bg-slate-100 text-slate-600"
          }`}
        >
          {statusLabels[ticket.status] || ticket.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">Siège</p>
          <p className="font-semibold text-slate-900">
            Rang {ticket.seat?.row} — Place {ticket.seat?.col}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Tarif actuel</p>
          <p className="font-semibold text-slate-900">
            {ticket.pricingName} — {formatPrice(ticket.price)}
          </p>
        </div>
        {ticket.session && (
          <>
            <div>
              <p className="text-xs text-slate-500">Film</p>
              <p className="font-semibold text-slate-900">{ticket.session.eventName || "–"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Séance</p>
              <p className="font-semibold text-slate-900">
                {formatDate(ticket.session.date)} {ticket.session.sessionTime && `• ${ticket.session.sessionTime}`}
              </p>
            </div>
          </>
        )}
        {ticket.booking && (
          <div>
            <p className="text-xs text-slate-500">Réservation</p>
            <p className="font-semibold text-slate-900">{ticket.booking.bookingNumber}</p>
          </div>
        )}
        {ticket.user && (
          <div>
            <p className="text-xs text-slate-500">Client</p>
            <p className="font-semibold text-slate-900">
              {[ticket.user.firstName, ticket.user.lastName].filter(Boolean).join(" ") ||
                ticket.user.email ||
                "–"}
            </p>
          </div>
        )}
      </div>

      {/* Multiple tickets in booking */}
      {Array.isArray(ticket.allTickets) && ticket.allTickets.length > 1 && (
        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Tous les billets de cette réservation
          </p>
          <div className="space-y-1">
            {ticket.allTickets.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2"
              >
                <span className="font-mono">{t.code}</span>
                <span>
                  {t.seat?.row}-{t.seat?.col}
                </span>
                <span>{t.pricingName}</span>
                <span className="font-semibold">{formatPrice(t.price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TarifCorrectionClient() {
  const [step, setStep] = useState(1);

  // Step 1
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [foundTicket, setFoundTicket] = useState(null);

  // Step 2
  const [selectedPricing, setSelectedPricing] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Step 3
  const [correctionResult, setCorrectionResult] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef(null);

  // ── Step 1: Search ──────────────────────────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    setSearchError("");
    setFoundTicket(null);

    try {
      const res = await fetch(`/api/guichet/tickets/search?q=${encodeURIComponent(q)}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSearchError(data.message || "Aucun billet trouvé.");
        return;
      }

      const ticket = data.ticket;

      if (ticket.status !== "active") {
        setSearchError(
          `Ce billet ne peut pas être modifié (statut : ${
            ticket.status === "scanned" ? "déjà scanné" : "annulé"
          }).`
        );
        return;
      }

      setFoundTicket(ticket);
      setSelectedPricing(null);
    } catch {
      setSearchError("Une erreur est survenue lors de la recherche.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleGoToStep2 = () => {
    setSubmitError("");
    setStep(2);
  };

  // ── Step 2: Select new pricing ──────────────────────────────────────────────
  const priceDiff =
    selectedPricing && foundTicket
      ? Math.round((Number(selectedPricing.price) - Number(foundTicket.price)) * 100) / 100
      : null;

  const handleApply = async () => {
    if (!selectedPricing || !foundTicket) return;
    if (priceDiff < 0) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`/api/guichet/tickets/${foundTicket.id}/reprice`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPricingName: selectedPricing.name,
          paymentMethod,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitError(data.message || "La correction n'a pas pu être appliquée.");
        return;
      }

      setCorrectionResult(data);
      setStep(3);
    } catch {
      setSubmitError("Une erreur est survenue. Merci de réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 3: Print ───────────────────────────────────────────────────────────
  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    setTimeout(() => setIsPrinting(false), 2000);
  };

  const handleReset = () => {
    setStep(1);
    setSearchQuery("");
    setFoundTicket(null);
    setSelectedPricing(null);
    setPaymentMethod("cash");
    setCorrectionResult(null);
    setSearchError("");
    setSubmitError("");
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6 print:hidden">
      {/* Header */}
      <div>
        <h1 className="font-secondary text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight uppercase">
          Correction de tarif
        </h1>
        <p className="text-slate-500 mt-2 text-sm">
          Recherchez un billet par son code ou numéro de réservation, modifiez son tarif et encaissez la différence.
        </p>
      </div>

      <StepIndicator step={step} />

      {/* ── Step 1 ─────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Icon
                name="search"
                className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                placeholder="TK-XXXXXXXXXXXXXXXX ou BK-YYYYMMDD-XXXX"
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-mono outline-none shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-primary text-white text-sm font-semibold rounded-xl transition hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Icon name="search" className="h-4 w-4" />
              )}
              Rechercher
            </button>
          </form>

          {searchError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {searchError}
            </div>
          )}

          {foundTicket && (
            <div className="space-y-4">
              <TicketCard ticket={foundTicket} />
              <button
                type="button"
                onClick={handleGoToStep2}
                className="w-full py-3.5 rounded-xl bg-primary text-white text-sm font-semibold tracking-wide transition hover:bg-primary/90"
              >
                Modifier le tarif →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2 ─────────────────────────────────────────────────────────── */}
      {step === 2 && foundTicket && (
        <div className="space-y-5">
          <TicketCard ticket={foundTicket} />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Sélectionner le nouveau tarif
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(foundTicket.session?.availablePricings || []).map((pricing) => {
                const isCurrentTarif =
                  pricing.name.toLowerCase() === foundTicket.pricingName.toLowerCase() &&
                  pricing.price === foundTicket.price;
                const diff = Math.round((pricing.price - foundTicket.price) * 100) / 100;
                const isSelected = selectedPricing?.name === pricing.name;

                return (
                  <button
                    key={pricing.name}
                    type="button"
                    disabled={isCurrentTarif}
                    onClick={() => setSelectedPricing(pricing)}
                    className={`relative flex items-center justify-between rounded-xl border-2 px-4 py-3.5 text-left transition ${
                      isCurrentTarif
                        ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 hover:border-primary/50 bg-white"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{pricing.name}</p>
                      {isCurrentTarif && (
                        <p className="text-xs text-slate-400">Tarif actuel</p>
                      )}
                      {!isCurrentTarif && diff > 0 && (
                        <p className="text-xs font-semibold text-emerald-600">+{formatPrice(diff)}</p>
                      )}
                      {!isCurrentTarif && diff === 0 && (
                        <p className="text-xs text-slate-400">Même prix, nom différent</p>
                      )}
                    </div>
                    <span className="text-base font-bold text-slate-900">{formatPrice(pricing.price)}</span>
                    {isSelected && (
                      <span className="absolute right-3 top-3 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                        <Icon name="check" className="h-2.5 w-2.5 text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedPricing && priceDiff < 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Le nouveau tarif est inférieur au tarif actuel. Le remboursement n&apos;est pas
                autorisé au guichet.
              </div>
            )}

            {selectedPricing && priceDiff >= 0 && (
              <div
                className={`rounded-xl border px-4 py-3 ${
                  priceDiff > 0
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="text-sm font-semibold text-slate-700">
                  {priceDiff > 0 ? (
                    <>
                      Supplément à encaisser :{" "}
                      <span className="text-amber-700 text-base">+{formatPrice(priceDiff)}</span>
                    </>
                  ) : (
                    <span className="text-slate-500">
                      Même montant — changement de nom de tarif uniquement
                    </span>
                  )}
                </p>
              </div>
            )}

            {selectedPricing && priceDiff > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Mode de paiement du supplément</p>
                <div className="flex gap-3">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                        paymentMethod === m.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ← Retour
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!selectedPricing || priceDiff < 0 || isSubmitting}
              className="flex-1 py-3.5 rounded-xl bg-primary text-white text-sm font-semibold tracking-wide transition hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Application...
                </span>
              ) : (
                "Appliquer la correction"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3 ─────────────────────────────────────────────────────────── */}
      {step === 3 && correctionResult && (
        <div className="space-y-5">
          {/* Success banner */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-start gap-4">
            <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center">
              <Icon name="check" className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-emerald-800">Correction appliquée avec succès</p>
              <p className="text-sm text-emerald-700 mt-0.5">
                Le billet a été mis à jour et la transaction enregistrée en caisse.
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Récapitulatif
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Code billet</p>
                <p className="font-mono font-semibold text-slate-900">{correctionResult.ticket?.code}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Siège</p>
                <p className="font-semibold text-slate-900">
                  Rang {correctionResult.ticket?.seat?.row} — Place {correctionResult.ticket?.seat?.col}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Ancien tarif</p>
                <p className="font-semibold text-slate-700 line-through">
                  {correctionResult.correction?.oldPricingName} — {formatPrice(correctionResult.correction?.oldPrice)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Nouveau tarif</p>
                <p className="font-semibold text-emerald-700">
                  {correctionResult.ticket?.pricingName} — {formatPrice(correctionResult.ticket?.price)}
                </p>
              </div>

              {correctionResult.priceDifference > 0 && (
                <>
                  <div>
                    <p className="text-xs text-slate-500">Supplément encaissé</p>
                    <p className="font-bold text-lg text-amber-700">
                      +{formatPrice(correctionResult.priceDifference)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Mode de paiement</p>
                    <p className="font-semibold text-slate-900 capitalize">
                      {correctionResult.correction?.paymentMethod === "cash" ? "Espèces" : "Carte bancaire"}
                    </p>
                  </div>
                </>
              )}

              {correctionResult.priceDifference === 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-500">Supplément</p>
                  <p className="text-sm text-slate-500">Aucun — changement de nom uniquement</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 py-3.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Nouvelle correction
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 py-3.5 rounded-xl bg-primary text-white text-sm font-semibold tracking-wide transition hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <Icon name="print" className="h-4 w-4" />
              {isPrinting ? "Impression..." : "Imprimer le nouveau billet"}
            </button>
          </div>

          {/* Print area — hidden on screen, visible on print */}
          {correctionResult.ticket && (
            <div ref={printRef} className="hidden print:block">
              <TicketPrintCard
                ticket={{
                  code: correctionResult.ticket.code,
                  seat: correctionResult.ticket.seat,
                  pricingName: correctionResult.ticket.pricingName,
                  price: correctionResult.ticket.price,
                  sessionDate: foundTicket?.session?.date,
                  sessionTime: foundTicket?.session?.sessionTime,
                  eventName: foundTicket?.session?.eventName,
                }}
                booking={{ bookingNumber: foundTicket?.booking?.bookingNumber }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
