"use client";

import { Icon } from "@/components/ui/icons";
import { STATUS_OPTIONS, TYPE_OPTIONS } from "@/lib/evenements/helpers";

export default function EventFilters({
  query,
  typeFilter,
  statusFilter,
  onQueryChange,
  onSearch,
  onTypeChange,
  onStatusChange,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex w-full md:w-[28rem] items-center gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Icon name="search" className="h-4 w-4" />
            </div>
            <input
              className="block w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
              placeholder="Rechercher par nom..."
              type="text"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSearch();
                }
              }}
            />
          </div>
          <button
            type="button"
            onClick={onSearch}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary/90"
          >
            Chercher
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(event) => onTypeChange(event.target.value)}
            className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="Tous">Tous les types</option>
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => onStatusChange(event.target.value)}
            className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="Tous">Statut : Tous</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
