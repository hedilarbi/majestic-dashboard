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

const formatAnswersPreview = (answers = []) =>
  answers
    .slice(0, 2)
    .map((answer) => {
      const value = answer.type === "checkbox" ? answer.values.join(", ") : answer.value;
      return value ? `${answer.label}: ${value}` : "";
    })
    .filter(Boolean)
    .join(" • ");

export default function FormSubmissionList({
  form,
  items = [],
  basePath = "/blogue/soumissions",
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Formulaire
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              {form?.title || "-"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {form?.formDescription || "Consultez les soumissions recues pour ce formulaire."}
            </p>
          </div>
          <div className="grid gap-3 text-sm text-slate-500 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Statut
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {form?.isPublished ? "Publie" : "Brouillon"}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Questions
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {Array.isArray(form?.questions) ? form.questions.length : 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Candidat</th>
                <th className="px-6 py-4 text-left font-semibold">Apercu</th>
                <th className="px-6 py-4 text-left font-semibold">Soumise le</th>
                <th className="px-6 py-4 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8">
                    Aucune soumission pour ce formulaire.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {item.customerName || "Utilisateur"}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {item.customerEmail || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatAnswersPreview(item.answers) || "Apercu indisponible"}
                    </td>
                    <td className="px-6 py-4">{formatDateTime(item.createdAt)}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`${basePath}/${form?.id}/${item.id}`}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-primary hover:text-primary"
                      >
                        Voir le detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
