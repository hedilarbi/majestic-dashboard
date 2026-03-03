import { RiArmchairFill, RiArmchairLine } from "react-icons/ri";

import SeatLegend from "@/components/guichet/SeatLegend";
import { formatPrice } from "@/lib/configurations/formatters";
import { getSeatStatus, isAisleCell, seatKey } from "@/lib/guichet/seat-utils";

const SeatIcon = ({ status, isMine }) => {
  if (status === "selected") {
    return <RiArmchairFill className="h-7 w-7 text-primary" />;
  }

  if (status === "reserved" && isMine) {
    return <RiArmchairFill className="h-7 w-7 text-primary" />;
  }

  if (
    status === "occupied" ||
    status === "booked" ||
    status === "reserved" ||
    status === "blocked" ||
    status === "staff"
  ) {
    return <RiArmchairFill className="h-7 w-7 text-slate-300" />;
  }

  return <RiArmchairLine className="h-7 w-7 text-slate-300" />;
};

const resolveOverrideMeta = (cell) => {
  if (!cell) {
    return null;
  }

  const raw =
    cell.pricingOverrideId !== undefined
      ? cell.pricingOverrideId
      : cell.pricingOverride;

  if (!raw) {
    return null;
  }

  if (typeof raw === "string" || typeof raw === "number") {
    return { id: String(raw) };
  }

  if (typeof raw !== "object") {
    return null;
  }

  const nestedPricing =
    raw.pricingId && typeof raw.pricingId === "object" ? raw.pricingId : null;
  const source = nestedPricing || raw;

  const name =
    source?.name ?? source?.nom ?? raw?.label ?? raw?.name ?? raw?.nom ?? "";
  const price =
    source?.price ??
    source?.prix ??
    raw?.price ??
    raw?.prix ??
    raw?.amount ??
    raw?.montant ??
    null;

  if (!name && price === null) {
    return null;
  }

  return { name, price };
};

export default function SeatMapSection({
  seatRows,
  maxCols,
  selectedSeatKeys,
  reservationSeatKeys,
  onToggleSeat,
  isLoading,
  loadError,
}) {
  return (
    <section className="flex-1 bg-slate-50/70 rounded-3xl border border-slate-200 p-6 lg:p-10 overflow-hidden">
      <div className="flex flex-col items-center justify-center py-6">
        <div className="w-full max-w-2xl mx-auto mb-12">
          <div className="h-1.5 w-4/5 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent rounded-full shadow-[0_6px_18px_rgba(16,52,166,0.25)]" />
          <p className="mt-3 text-center text-slate-400 tracking-[0.6em] text-[10px] uppercase font-semibold">
            Écran
          </p>
        </div>

        <div className="space-y-6">
          {seatRows.map((row) => (
            <div key={row.label} className="flex items-center gap-4">
              <span className="w-4 text-[11px] font-semibold text-slate-400">
                {row.label}
              </span>
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${maxCols || 1}, minmax(0, 1fr))`,
                }}
              >
                {row.cells.map((cell, index) => {
                  if (!cell || isAisleCell(cell)) {
                    return (
                      <div
                        key={`${row.label}-empty-${index}`}
                        className="h-7 w-7"
                        aria-hidden="true"
                      />
                    );
                  }

                  const key = seatKey(cell.row, cell.col);
                  const isSelected = selectedSeatKeys.has(key);
                  const status = getSeatStatus(cell.status);
                  const isMine = reservationSeatKeys.has(key);
                  const displayStatus = isSelected ? "selected" : status;
                  const isBookable = cell.isBookable !== false;
                  const canSelect = status === "available" && isBookable;
                  const isDisabled = !isSelected && !canSelect;
                  const overrideMeta = resolveOverrideMeta(cell);
                  const overrideLabel = overrideMeta
                    ? `${overrideMeta.name || "Tarif fixe"}${
                        overrideMeta.price !== null &&
                        overrideMeta.price !== undefined
                          ? ` (${formatPrice(overrideMeta.price)})`
                          : ""
                      }`
                    : "";

                  return (
                    <button
                      key={key}
                      type="button"
                      className={`transition ${
                        isDisabled ? "cursor-not-allowed" : "hover:text-primary"
                      }`}
                      disabled={isDisabled}
                      aria-label={`Siège ${row.label}${cell.col}`}
                      title={
                        overrideLabel
                          ? `Siège ${row.label}${cell.col} - ${overrideLabel}`
                          : `Siège ${row.label}${cell.col}`
                      }
                      aria-pressed={isSelected}
                      onClick={() => onToggleSeat(cell)}
                    >
                      <SeatIcon status={displayStatus} isMine={isMine} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {!seatRows.length && !isLoading ? (
            <p className="text-xs text-slate-400 text-center">
              Aucun plan de salle disponible.
            </p>
          ) : null}
          {loadError ? (
            <p className="text-xs text-amber-600 text-center">{loadError}</p>
          ) : null}
        </div>

        <SeatLegend />
      </div>
    </section>
  );
}
