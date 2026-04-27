"use client";

import {
  DASHBOARD_PERMISSION_ACTIONS,
  DASHBOARD_PERMISSION_DEFINITIONS,
} from "@/lib/dashboard-permissions";

const ACTION_LABELS = {
  list: "Lister",
  create: "Créer",
  update: "Modifier",
  delete: "Supprimer",
};

export default function AdminPermissionsMatrix({
  value = {},
  onToggle,
  disabled = false,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Permissions admin</h3>
        <p className="mt-1 text-xs text-slate-500">
          Activez les actions autorisées pour cet administrateur.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/70 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Module</th>
              {DASHBOARD_PERMISSION_ACTIONS.map((action) => (
                <th key={action} className="px-4 py-3 text-center font-semibold">
                  {ACTION_LABELS[action]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {DASHBOARD_PERMISSION_DEFINITIONS.map((definition) => (
              <tr key={definition.module} className="bg-white/50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {definition.label}
                </td>
                {DASHBOARD_PERMISSION_ACTIONS.map((action) => {
                  const supported = definition.actions.includes(action);
                  const checked = Boolean(value?.[definition.module]?.[action]);

                  return (
                    <td key={action} className="px-4 py-3 text-center">
                      {supported ? (
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => onToggle?.(definition.module, action)}
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/40"
                        />
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
