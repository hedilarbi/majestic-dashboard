"use client";

import { useEffect, useState } from "react";

const getCookie = (name) => {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : "";
};

const BAR_COLORS = [
  "bg-primary",
  "bg-accent/70",
  "bg-indigo-400",
  "bg-emerald-400",
  "bg-amber-400",
  "bg-rose-400",
];

const DailyChart = ({ dailyCounts = [] }) => {
  if (!dailyCounts.length) return null;
  const max = Math.max(...dailyCounts.map((d) => d.count), 1);

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-end gap-1 px-1 pt-2" style={{ height: 80 }}>
        {dailyCounts.map((d) => (
          <div key={d._id} className="group relative flex flex-col items-center">
            <div
              className="w-5 rounded-t bg-primary transition-all group-hover:bg-primary/70"
              style={{ height: Math.max(4, Math.round((d.count / max) * 64)) }}
            />
            <span className="mt-1 text-[9px] text-slate-400 rotate-45 origin-top-left">
              {d._id.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function FormStatsPanel({ formId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!formId) return;
    const token = getCookie("auth_token");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    fetch(`${baseUrl}/blog-form-submissions/forms/${formId}/stats`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.totalCount !== undefined) setStats(data);
        else setError("Statistiques indisponibles.");
      })
      .catch(() => setError("Erreur lors du chargement des statistiques."))
      .finally(() => setLoading(false));
  }, [formId]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-400">
        Chargement des statistiques…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Statistiques
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total soumissions</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">30 derniers jours</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {stats.dailyCounts.reduce((sum, d) => sum + d.count, 0)}
            </p>
          </div>
        </div>

        {stats.dailyCounts.length > 0 ? (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold text-slate-500">Soumissions par jour (30 jours)</p>
            <DailyChart dailyCounts={stats.dailyCounts} />
          </div>
        ) : null}
      </div>

      {stats.questionStats.map((q) => {
        const total = Object.values(q.distribution).reduce((s, v) => s + v, 0) || 1;
        const entries = Object.entries(q.distribution).sort((a, b) => b[1] - a[1]);
        if (!entries.length) return null;

        return (
          <div key={q.questionId} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">{q.label}</p>
            <div className="mt-4 space-y-2">
              {entries.map(([option, count], idx) => (
                <div key={option}>
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>{option}</span>
                    <span>{count} ({Math.round((count / total) * 100)}%)</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${BAR_COLORS[idx % BAR_COLORS.length]}`}
                      style={{ width: `${Math.round((count / total) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
