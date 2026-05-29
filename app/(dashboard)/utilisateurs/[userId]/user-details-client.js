"use client";

import { Icon } from "@/components/ui/icons";
import Link from "next/link";

export default function UserDetailsClient({ user, bookings = [], subscriptions = [] }) {
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Link 
          href="/utilisateurs" 
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-sm"
        >
          <Icon name="chevronLeft" className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-secondary text-2xl font-semibold text-slate-900 tracking-tight">
            Détails de l'utilisateur
          </h1>
          <p className="text-slate-500 text-sm">
            Fiche complète de {user.firstName} {user.lastName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{user.firstName} {user.lastName}</h2>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold uppercase">
                  {user.role}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${user.status === "suspended" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {user.status === "suspended" ? "Bloqué" : "Actif"}
                </span>
              </div>
            </div>

            <div className="mt-8 space-y-4 border-t border-slate-100 pt-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Téléphone</span>
                <span className="font-medium text-slate-900">{user.phone || "-"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Inscrit le</span>
                <span className="font-medium text-slate-900">{user.createdAt ? new Date(user.createdAt).toLocaleDateString("fr-FR") : "-"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Dernière visite</span>
                <span className="font-medium text-slate-900">{user.lastSeenAt ? new Date(user.lastSeenAt).toLocaleDateString("fr-FR") : "Jamais"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="lg:col-span-2 space-y-8">
          {/* Subscriptions */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200">
              <h3 className="font-secondary text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Icon name="ticket" className="h-5 w-5 text-primary" />
                Abonnements
              </h3>
            </div>
            {subscriptions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Aucun abonnement actif ou passé.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {subscriptions.map((s) => (
                  <div key={s._id} className="p-6 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">{s.subscriptionId?.name || "Abonnement"}</h4>
                      <p className="text-sm text-slate-500">{s.subscriptionCode}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-primary">{s.remainingCredits} / {s.totalCredits} crédits</div>
                      <p className="text-xs text-slate-400">Expire le {new Date(s.subscriptionId?.expirationDate || s.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bookings */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200">
              <h3 className="font-secondary text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Icon name="calendar" className="h-5 w-5 text-primary" />
                Dernières réservations
              </h3>
            </div>
            {bookings.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Aucune réservation trouvée.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Séance</th>
                      <th className="px-6 py-4">N° Réservation</th>
                      <th className="px-6 py-4">Sièges</th>
                      <th className="px-6 py-4 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-600">
                    {bookings.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{b.sessionId?.eventId?.name || "Séance"}</div>
                          <div className="text-xs text-slate-500">
                            {b.sessionId?.date ? new Date(b.sessionId.date).toLocaleDateString("fr-FR") : ""} - {b.sessionId?.sessionTime}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{b.bookingNumber}</td>
                        <td className="px-6 py-4">{b.seats?.length}</td>
                        <td className="px-6 py-4 text-right font-semibold">{b.totalAmount} DT</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
