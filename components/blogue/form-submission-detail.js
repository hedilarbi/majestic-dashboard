const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
};

const renderAnswerValue = (answer) => {
  if (answer?.type === "checkbox") {
    return answer?.values?.length ? answer.values.join(", ") : "-";
  }

  return answer?.value || "-";
};

export default function FormSubmissionDetail({ item }) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Soumission
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          {item?.formTitle || "Formulaire"}
        </h1>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Candidat
            </div>
            <div className="mt-1 font-semibold text-slate-900">
              {item?.customerName || "Utilisateur"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Email
            </div>
            <div className="mt-1 font-semibold text-slate-900">
              {item?.customerEmail || "-"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Date d&apos;envoi
            </div>
            <div className="mt-1 font-semibold text-slate-900">
              {formatDateTime(item?.createdAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Reponses</h2>
        <div className="mt-6 space-y-4">
          {item?.answers?.length ? (
            item.answers.map((answer, index) => (
              <div
                key={`${answer.questionId || index}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {answer.label || `Question ${index + 1}`}
                  </h3>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {answer.type}
                  </span>
                  {answer.required ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                      Obligatoire
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 text-sm text-slate-600">
                  {renderAnswerValue(answer)}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
              Aucune réponse disponible.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
