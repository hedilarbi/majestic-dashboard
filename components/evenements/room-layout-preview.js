"use client";

import { useMemo } from "react";

import { RiArmchairFill, RiArmchairLine } from "react-icons/ri";

const buildGrid = (room) => {
  const layout = Array.isArray(room?.layout) ? room.layout : [];

  if (!layout.length) {
    return {
      rows: [],
      columns: 0,
      cellMap: new Map(),
      overrideMap: new Map(),
      pricingMap: new Map(),
    };
  }

  const rowsSet = new Set();
  let columns = 0;
  const cellMap = new Map();

  layout.forEach((cell) => {
    const row = cell?.row ? String(cell.row) : "";
    const col = Number(cell?.col);

    if (!row || !Number.isFinite(col)) {
      return;
    }

    rowsSet.add(row);
    columns = Math.max(columns, col);
    cellMap.set(`${row}-${col}`, cell?.cellType ?? "chaise");
  });

  const overrideMap = new Map();
  const overrides = Array.isArray(room?.overrides) ? room.overrides : [];

  overrides.forEach((override) => {
    const row = override?.row ? String(override.row) : "";
    const col = Number(override?.col);

    if (!row || !Number.isFinite(col)) {
      return;
    }

    overrideMap.set(`${row}-${col}`, override?.status ?? "");
  });

  const pricingMap = new Map();
  const pricingOverrides = Array.isArray(room?.pricingOverrides)
    ? room.pricingOverrides
    : [];

  pricingOverrides.forEach((override) => {
    const row = override?.row ? String(override.row) : "";
    const col = Number(override?.col);

    if (!row || !Number.isFinite(col)) {
      return;
    }

    pricingMap.set(`${row}-${col}`, override?.pricingId ?? "");
  });

  const rows = Array.from(rowsSet).sort((a, b) =>
    a.localeCompare(b, "fr", { numeric: true })
  );

  return {
    rows,
    columns,
    cellMap,
    overrideMap,
    pricingMap,
  };
};

const CELL_BASE =
  "h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center";

const getSeatClass = ({ isStaff, isPricing }) => {
  if (isPricing) {
    return "text-amber-500";
  }

  if (isStaff) {
    return "text-emerald-500";
  }

  return "text-primary";
};

export default function RoomLayoutPreview({ room }) {
  const grid = useMemo(() => buildGrid(room), [room]);

  if (!room) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
        Aucune salle sélectionnée.
      </div>
    );
  }

  if (!grid.rows.length || !grid.columns) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
        Plan indisponible.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="font-semibold uppercase tracking-wide text-slate-400">
          Plan de la salle
        </span>
        <span>
          {room.name}
          {room.capacity ? ` • ${room.capacity} places` : ""}
        </span>
      </div>

      <div className="flex flex-col items-center justify-center">
        <div className="h-2 w-32 rounded-full bg-slate-200 relative">
          <span className="absolute left-1/2 top-3 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Écran
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="space-y-2 min-w-max">
          {grid.rows.map((row) => (
            <div key={row} className="flex items-center gap-2">
              <span className="w-4 text-[10px] font-semibold text-slate-500">
                {row}
              </span>
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: grid.columns }, (_, index) => {
                  const col = index + 1;
                  const key = `${row}-${col}`;
                  const cellType = grid.cellMap.get(key);
                  const override = grid.overrideMap.get(key);
                  const hasPricing = grid.pricingMap.get(key);
                  const isStaff = override === "staff";

                  if (!cellType) {
                    return (
                      <span key={key} className={`${CELL_BASE} bg-transparent`} />
                    );
                  }

                  if (cellType === "couloir") {
                    return (
                      <span
                        key={key}
                        className={`${CELL_BASE} border border-dashed border-slate-300 bg-white/40`}
                      />
                    );
                  }

                  return (
                    <span
                      key={key}
                      className={`${CELL_BASE} ${getSeatClass({
                        isStaff,
                        isPricing: Boolean(hasPricing),
                      })}`}
                    >
                      {isStaff || hasPricing ? (
                        <RiArmchairFill className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <RiArmchairLine className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <RiArmchairLine className="h-5 w-5 text-primary" />
          Standard
        </div>
        <div className="flex items-center gap-1.5">
          <RiArmchairFill className="h-5 w-5 text-emerald-500" />
          Staff
        </div>
        <div className="flex items-center gap-1.5">
          <RiArmchairFill className="h-5 w-5 text-amber-500" />
          Tarif fixe
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-slate-300 bg-white/40" />
          Couloir
        </div>
      </div>
    </div>
  );
}
