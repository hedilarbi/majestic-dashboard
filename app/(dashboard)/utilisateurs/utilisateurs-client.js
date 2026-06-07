"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

import ExportButtons from "@/components/dashboard/export-buttons";
import { Icon } from "@/components/ui/icons";
import ConfirmModal from "@/components/ui/confirm-modal";
import { useToast } from "@/hooks/use-toast";
import { useDashboardModulePermissions } from "@/hooks/use-dashboard-permissions";

const ROLE_LABELS = {
  customer: "Client",
  guest: "Invité",
};

const ROLE_STYLES = {
  super_admin: "bg-violet-100 text-violet-700",
  admin: "bg-indigo-100 text-indigo-700",
  customer: "bg-blue-100 text-blue-700",
  guest: "bg-slate-100 text-slate-700",
  fallback: "bg-slate-50 text-slate-500",
};

export default function UtilisateursClient({ initialData, initialError = "" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const permissions = useDashboardModulePermissions("users");

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [role, setRole] = useState(searchParams.get("role") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");

  const [pendingStatusToggle, setPendingStatusToggle] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const users = initialData.items || [];
  const total = initialData.total || 0;
  const page = initialData.page || 1;

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search) params.set("search", search); else params.delete("search");
    if (role) params.set("role", role); else params.delete("role");
    if (status) params.set("status", status); else params.delete("status");
    if (dateFrom) params.set("dateFrom", dateFrom); else params.delete("dateFrom");
    if (dateTo) params.set("dateTo", dateTo); else params.delete("dateTo");
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleToggleStatus = async () => {
    if (!pendingStatusToggle) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/users/${pendingStatusToggle._id}/toggle-status`, {
        method: "POST",
      });
      const response = await res.json().catch(() => ({}));
      if (response.ok) {
        showToast(`Utilisateur ${response.status === "suspended" ? "bloqué" : "débloqué"} avec succès.`, "success");
        setPendingStatusToggle(null);
        router.refresh();
      } else {
        showToast(response.message || "Une erreur est survenue", "error");
      }
    } catch {
      showToast("Une erreur est survenue", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-secondary text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
            Utilisateurs
          </h1>
          <p className="text-slate-500 mt-1">
            Gérez les clients et utilisateurs de la plateforme.
          </p>
        </div>
        <ExportButtons
          resource="utilisateurs"
          queryString={searchParams.toString()}
        />
      </div>

      {initialError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {initialError}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
        <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            />
            <Icon name="search" className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition appearance-none"
          >
            <option value="">Tous les rôles</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition appearance-none"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="suspended">Bloqué</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            aria-label="Date début"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            aria-label="Date fin"
          />
          <button
            type="submit"
            className="bg-primary text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary/90 transition shadow-sm shadow-primary/30"
          >
            Filtrer
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Rôle</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-sm text-slate-400">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : null}
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {u.firstName} {u.lastName}
                    </div>
                    <div className="text-xs text-slate-500">{u.phone}</div>
                  </td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_STYLES[u.role] || ROLE_STYLES.fallback}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${u.status === "suspended" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {u.status === "suspended" ? "Bloqué" : "Actif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/utilisateurs/${u._id}`}
                        className="p-2 text-slate-400 hover:text-primary transition hover:bg-primary/10 rounded-lg"
                        title="Voir détails"
                      >
                        <Icon name="search" className="h-5 w-5" />
                      </Link>
                      {permissions.canUpdate && (
                        <button
                          onClick={() => setPendingStatusToggle(u)}
                          className={`p-2 transition rounded-lg ${u.status === "suspended" ? "text-emerald-600 hover:bg-emerald-50" : "text-red-600 hover:bg-red-50"}`}
                          title={u.status === "suspended" ? "Débloquer" : "Bloquer"}
                        >
                          <Icon name={u.status === "suspended" ? "unlock" : "lock"} className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pendingStatusToggle && (
        <ConfirmModal
          title={pendingStatusToggle.status === "suspended" ? "Débloquer l'utilisateur" : "Bloquer l'utilisateur"}
          message={`Êtes-vous sûr de vouloir ${pendingStatusToggle.status === "suspended" ? "débloquer" : "bloquer"} ${pendingStatusToggle.firstName} ${pendingStatusToggle.lastName} ?`}
          onConfirm={handleToggleStatus}
          onClose={() => setPendingStatusToggle(null)}
          isConfirming={isUpdating}
          confirmText={pendingStatusToggle.status === "suspended" ? "Débloquer" : "Bloquer"}
          variant={pendingStatusToggle.status === "suspended" ? "primary" : "danger"}
        />
      )}
    </div>
  );
}
