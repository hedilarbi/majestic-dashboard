import Link from "next/link";

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function FormSubmissionFormsList({
  items = [],
  basePath = "/blogue/soumissions",
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Formulaire</th>
              <th className="px-6 py-4 text-left font-semibold">Statut</th>
              <th className="px-6 py-4 text-left font-semibold">Soumissions</th>
              <th className="px-6 py-4 text-left font-semibold">Derniere soumission</th>
              <th className="px-6 py-4 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-600">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8">
                  Aucun formulaire disponible.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{item.title || "-"}</div>
                    <div className="mt-1 text-xs text-slate-400">/{item.slug || "-"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        item.isPublished
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.isPublished ? "Publie" : "Brouillon"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {item.submissionCount}
                  </td>
                  <td className="px-6 py-4">{formatDateTime(item.latestSubmissionAt)}</td>
                  <td className="px-6 py-4">
                    <Link
                      href={`${basePath}/${item.id}`}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-primary hover:text-primary"
                    >
                      Voir les détails
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
