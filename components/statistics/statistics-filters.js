export default function StatisticsFilters({
  events = [],
  sessionTimes = [],
  selectedEventId = "",
  selectedSessionTime = "",
  dateStart = "",
  dateEnd = "",
  selectedView = "sessions",
  viewOptions = [],
}) {
  return (
    <form
      method="GET"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]">
        <div>
          <label
            htmlFor="dateStart"
            className="text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            Date debut
          </label>
          <input
            id="dateStart"
            name="dateStart"
            type="date"
            defaultValue={dateStart}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-primary"
          />
        </div>

        <div>
          <label
            htmlFor="dateEnd"
            className="text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            Date fin
          </label>
          <input
            id="dateEnd"
            name="dateEnd"
            type="date"
            defaultValue={dateEnd}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-primary"
          />
        </div>

        <div>
          <label
            htmlFor="view"
            className="text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            Type de statistique
          </label>
          <select
            id="view"
            name="view"
            defaultValue={selectedView}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-primary"
          >
            {viewOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="eventId"
            className="text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            Événement
          </label>
          <select
            id="eventId"
            name="eventId"
            defaultValue={selectedEventId}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-primary"
          >
            <option value="">Tous les événements</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="sessionTime"
            className="text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            Heure de séance
          </label>
          <select
            id="sessionTime"
            name="sessionTime"
            defaultValue={selectedSessionTime}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-primary"
          >
            <option value="">Toutes les heures</option>
            {sessionTimes.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Filtrer
          </button>
          <a
            href="/statistiques"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Reset
          </a>
        </div>
      </div>
    </form>
  );
}
