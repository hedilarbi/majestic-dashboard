import { Icon } from "@/components/ui/icons";

const STATS = [
  {
    label: "Total Evenements",
    value: "124",
    trend: "+5%",
    trendType: "up",
    icon: "theater",
  },
  {
    label: "Billets Vendu",
    value: "14 203",
    trend: "+12%",
    trendType: "up",
    icon: "activity",
  },
  {
    label: "Revenus",
    value: "142k €",
    trend: "+8%",
    trendType: "up",
    icon: "money",
  },
  {
    label: "Seances a venir",
    value: "8",
    trend: "0%",
    trendType: "flat",
    icon: "clock",
  },
];

const POPULAR_EVENTS = [
  { name: "Dune: Deuxieme Partie", percent: 85, color: "bg-primary" },
  { name: "Kung Fu Panda 4", percent: 62, color: "bg-indigo-500" },
  { name: "Godzilla x Kong", percent: 45, color: "bg-cyan-500" },
  { name: "Civil War", percent: 30, color: "bg-amber-500" },
];

const STATUS_STYLES = {
  confirmed: {
    label: "Confirme",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "En attente",
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
  canceled: {
    label: "Annule",
    badge: "bg-red-100 text-red-800",
    dot: "bg-red-500",
  },
};

const RECENT_ACTIVITY = [
  {
    id: "#TIX-0092",
    customer: "Sarah Jenkins",
    movie: "Dune: Deuxieme Partie",
    time: "il y a 2 min",
    status: "confirmed",
    amount: "45,00 €",
  },
  {
    id: "#TIX-0091",
    customer: "Mike Ross",
    movie: "Civil War",
    time: "il y a 15 min",
    status: "pending",
    amount: "15,00 €",
  },
  {
    id: "#TIX-0090",
    customer: "Emily Wong",
    movie: "Kung Fu Panda 4",
    time: "il y a 1h",
    status: "canceled",
    amount: "30,00 €",
  },
  {
    id: "#TIX-0089",
    customer: "David Liu",
    movie: "Dune: Deuxieme Partie",
    time: "il y a 2h",
    status: "confirmed",
    amount: "60,00 €",
  },
  {
    id: "#TIX-0088",
    customer: "Jessica Pearson",
    movie: "Godzilla x Kong",
    time: "il y a 3h",
    status: "confirmed",
    amount: "22,50 €",
  },
];

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 fade-up">
        <div>
          <h1 className="font-secondary text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
            Vue d&apos;ensemble
          </h1>
          <p className="text-slate-500 mt-1">
            Suivez les performances et les ventes de votre cinema en temps
            reel.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 active:bg-primary/80 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm shadow-primary/30 transition-all">
          <Icon name="plus" className="h-5 w-5" />
          <span>Creer un evenement</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 fade-up fade-up-delay-1">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Icon name={stat.icon} className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <h3 className="text-3xl font-semibold text-slate-900">
                {stat.value}
              </h3>
              {stat.trendType === "up" ? (
                <span className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Icon name="trendingUp" className="h-4 w-4 mr-1" />
                  {stat.trend}
                </span>
              ) : (
                <span className="flex items-center text-sm font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  <Icon name="minus" className="h-4 w-4 mr-1" />
                  {stat.trend}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-up fade-up-delay-2">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-secondary text-lg font-semibold text-slate-900">
                Tendance des ventes hebdomadaires
              </h3>
              <p className="text-sm text-slate-500">
                Performance des revenus sur les 7 derniers jours
              </p>
            </div>
            <select className="bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 py-2 px-3 focus:ring-2 focus:ring-accent focus:outline-none cursor-pointer">
              <option>7 derniers jours</option>
              <option>30 derniers jours</option>
            </select>
          </div>
          <div className="w-full h-64 relative">
            <svg
              className="w-full h-full overflow-visible text-primary"
              preserveAspectRatio="none"
              viewBox="0 0 500 150"
              fill="none"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                  <stop
                    offset="100%"
                    stopColor="currentColor"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
              <line
                stroke="#e2e8f0"
                strokeWidth="1"
                x1="0"
                x2="500"
                y1="150"
                y2="150"
              />
              <line
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
                x1="0"
                x2="500"
                y1="100"
                y2="100"
              />
              <line
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
                x1="0"
                x2="500"
                y1="50"
                y2="50"
              />
              <line
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
                x1="0"
                x2="500"
                y1="0"
                y2="0"
              />
              <path
                d="M0,120 Q50,110 100,80 T200,60 T300,90 T400,40 T500,20 V150 H0 Z"
                fill="url(#chartGradient)"
              />
              <path
                d="M0,120 Q50,110 100,80 T200,60 T300,90 T400,40 T500,20"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
              <circle
                className="fill-white"
                stroke="currentColor"
                strokeWidth="2"
                cx="100"
                cy="80"
                r="4"
              />
              <circle
                className="fill-white"
                stroke="currentColor"
                strokeWidth="2"
                cx="200"
                cy="60"
                r="4"
              />
              <circle
                className="fill-white"
                stroke="currentColor"
                strokeWidth="2"
                cx="300"
                cy="90"
                r="4"
              />
              <circle
                className="fill-white"
                stroke="currentColor"
                strokeWidth="2"
                cx="400"
                cy="40"
                r="4"
              />
            </svg>
            <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium px-1">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mer</span>
              <span>Jeu</span>
              <span>Ven</span>
              <span>Sam</span>
              <span>Dim</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-secondary text-lg font-semibold text-slate-900 mb-6">
            Evenements populaires
          </h3>
          <div className="flex-1 space-y-6">
            {POPULAR_EVENTS.map((event) => (
              <div key={event.name} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-slate-700">
                    {event.name}
                  </span>
                  <span className="text-slate-500">{event.percent}% Vendu</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${event.color} rounded-full`}
                    style={{ width: `${event.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full py-2 text-sm text-primary font-medium hover:bg-slate-50 rounded-lg transition-colors">
            Voir tous les evenements
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden fade-up fade-up-delay-3">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-secondary text-lg font-semibold text-slate-900">
              Activite recente
            </h3>
            <p className="text-sm text-slate-500">
              Dernieres reservations et mises a jour systeme.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Filtrer
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Exporter
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">ID Transaction</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Evenement / Film</th>
                <th className="px-6 py-4">Heure</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {RECENT_ACTIVITY.map((row) => {
                const status = STATUS_STYLES[row.status];

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-slate-500">
                      {row.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {row.customer}
                    </td>
                    <td className="px-6 py-4">{row.movie}</td>
                    <td className="px-6 py-4 text-slate-500">{row.time}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.badge}`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${status.dot}`}
                        />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {row.amount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
