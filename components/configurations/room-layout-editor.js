"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { getCellKey } from "@/lib/configurations/rooms";
import { RiArmchairFill, RiArmchairLine } from "react-icons/ri";

const CELL_BASE =
  "h-6 w-6 sm:h-7 sm:w-7 transition flex items-center justify-center";

const TEXT = {
  empty: "Plan non généré.",
  title: "Plan de la salle",
  screen: "Écran",
  legendStandard: "Standard",
  legendStaff: "Staff",
  legendPricing: "Tarif fixe",
  legendAisle: "Couloir",
  optionsLabel: "Cellule",
  seat: "Siège standard",
  staff: "Siège staff",
  aisle: "Couloir",
  pricing: "Siège tarif fixe",
  pricingSelect: "Choisir un tarif",
  pricingEmpty: "Aucun tarif disponible.",
};

const getCellStyle = ({
  cellType,
  isStaff,
  isPricing,
  isSelected,
}) => {
  if (cellType === "couloir") {
    return `${CELL_BASE} border border-dashed border-slate-300 bg-transparent ${
      isSelected ? "outline outline-2 outline-slate-500" : ""
    }`;
  }

  const baseClass = isPricing
    ? "text-amber-500"
    : isStaff
    ? "text-emerald-500"
    : "text-primary";

  return `${CELL_BASE} ${baseClass} ${
    isSelected ? "outline outline-2 outline-slate-500" : ""
  }`;
};

const getOptionClass = ({ isActive, isDisabled }) => {
  if (isActive) {
    return "border-primary bg-primary/10 text-primary";
  }

  if (isDisabled) {
    return "border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed";
  }

  return "border-slate-200 text-slate-500 hover:border-primary hover:text-primary";
};

export default function RoomLayoutEditor({
  rows = [],
  columns = 0,
  layoutMap = {},
  staffMap = {},
  pricingMap = {},
  pricingOptions = [],
  selectedCell,
  onSelectCell,
  onSetCellType,
  onSetPricingId,
}) {
  const [contextMenu, setContextMenu] = useState(null);

  const activeCell = contextMenu?.cell || selectedCell;
  const activeKey = useMemo(() => {
    if (!activeCell) {
      return "";
    }

    return getCellKey(activeCell.row, activeCell.col);
  }, [activeCell]);

  const selectedType = useMemo(() => {
    if (!activeKey) {
      return "";
    }

    if (layoutMap[activeKey] === "couloir") {
      return "couloir";
    }

    if (pricingMap[activeKey]) {
      return "pricing";
    }

    if (staffMap[activeKey]) {
      return "staff";
    }

    return "seat";
  }, [layoutMap, pricingMap, staffMap, activeKey]);

  const selectedPricingId = activeKey ? pricingMap[activeKey] || "" : "";
  const hasPricing = pricingOptions.length > 0;

  const optionItems = [
    { id: "seat", label: TEXT.seat },
    { id: "couloir", label: TEXT.aisle },
    { id: "staff", label: TEXT.staff },
    { id: "pricing", label: TEXT.pricing, disabled: !hasPricing },
  ];

  useEffect(() => {
    if (!contextMenu) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (event.target.closest("[data-room-menu]")) {
        return;
      }
      setContextMenu(null);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };

    const handleScroll = () => {
      setContextMenu(null);
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [contextMenu]);

  const getMenuPosition = (x, y) => {
    if (typeof window === "undefined") {
      return { left: x, top: y };
    }

    const padding = 8;
    const width = 220;
    const height = hasPricing ? 230 : 190;
    let left = x;
    let top = y;

    if (left + width > window.innerWidth - padding) {
      left = window.innerWidth - width - padding;
    }

    if (top + height > window.innerHeight - padding) {
      top = window.innerHeight - height - padding;
    }

    if (left < padding) {
      left = padding;
    }

    if (top < padding) {
      top = padding;
    }

    return { left, top };
  };

  const handleContextMenu = (event, cell) => {
    event.preventDefault();
    onSelectCell(cell);
    const { left, top } = getMenuPosition(event.clientX, event.clientY);
    setContextMenu({ left, top, cell });
  };

  const handleCellClick = (cell) => {
    onSelectCell(cell);
    setContextMenu(null);
  };

  const handleMenuAction = (type) => {
    const targetCell = contextMenu?.cell || selectedCell;
    if (!targetCell) {
      return;
    }

    onSetCellType(type, targetCell);

    if (type !== "pricing") {
      setContextMenu(null);
    }
  };

  const handleMenuPricingChange = (event) => {
    const value = event.target.value;
    const targetCell = contextMenu?.cell || selectedCell;
    if (!targetCell) {
      return;
    }

    onSetPricingId(value, targetCell);
    setContextMenu(null);
  };

  if (!rows.length || !columns) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
        {TEXT.empty}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="font-semibold uppercase tracking-wide text-slate-400">
          {TEXT.title}
        </span>
        {activeCell ? (
          <span className="text-slate-500">
            {TEXT.optionsLabel} {activeCell.row}-{activeCell.col}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col items-center">
        <div className="h-2 w-32 rounded-full bg-slate-200 relative">
          <span className="absolute left-1/2 top-3 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            {TEXT.screen}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="space-y-2 min-w-max">
          {rows.map((row) => (
            <div key={row} className="flex items-center gap-2">
              <span className="w-4 text-[10px] font-semibold text-slate-500">
                {row}
              </span>
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: columns }, (_, index) => {
                  const col = index + 1;
                  const key = getCellKey(row, col);
                  const cellType = layoutMap[key] || "chaise";
                  const isStaff = Boolean(staffMap[key]);
                  const isPricing = Boolean(pricingMap[key]);
                  const isSelected = activeKey === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleCellClick({ row, col })}
                      onContextMenu={(event) =>
                        handleContextMenu(event, { row, col })
                      }
                      className={getCellStyle({
                        cellType,
                        isStaff,
                        isPricing,
                        isSelected,
                      })}
                      aria-pressed={isSelected}
                    >
                      {cellType === "couloir" ? null : isPricing || isStaff ? (
                        <RiArmchairFill className="h-5 w-5 sm:h-6 sm:w-6" />
                      ) : (
                        <RiArmchairLine className="h-5 w-5 sm:h-6 sm:w-6" />
                      )}
                    </button>
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
          {TEXT.legendStandard}
        </div>
        <div className="flex items-center gap-1.5">
          <RiArmchairFill className="h-5 w-5 text-emerald-500" />
          {TEXT.legendStaff}
        </div>
        <div className="flex items-center gap-1.5">
          <RiArmchairFill className="h-5 w-5 text-amber-500" />
          {TEXT.legendPricing}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-slate-300 bg-white/60" />
          {TEXT.legendAisle}
        </div>
      </div>

      {contextMenu && typeof document !== "undefined"
        ? createPortal(
            <div
              data-room-menu
              className="fixed z-[70] w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
              style={{ left: contextMenu.left, top: contextMenu.top }}
            >
              <div className="text-xs font-semibold text-slate-400 uppercase">
                {TEXT.optionsLabel} {contextMenu.cell.row}-{contextMenu.cell.col}
              </div>
              <div className="mt-2 space-y-1">
                {optionItems.map((option) => {
                  const isActive = selectedType === option.id;
                  const isDisabled = Boolean(option.disabled);

                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleMenuAction(option.id)}
                      className={`w-full rounded-lg border px-3 py-1.5 text-left text-xs font-semibold transition ${getOptionClass(
                        { isActive, isDisabled }
                      )}`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {selectedType === "pricing" && hasPricing ? (
                <div className="mt-3">
                  <label
                    htmlFor="pricing-select-context"
                    className="block text-xs font-semibold text-slate-500 mb-1"
                  >
                    {TEXT.pricingSelect}
                  </label>
                  <select
                    id="pricing-select-context"
                    value={selectedPricingId}
                    onChange={handleMenuPricingChange}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  >
                    <option value="">--</option>
                    {pricingOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
