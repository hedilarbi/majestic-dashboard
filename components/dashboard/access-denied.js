export default function DashboardAccessDenied({
  title = "Accès refuse",
  message = "Vous n'avez pas la permission d'accéder à cette section.",
}) {
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-amber-200 bg-amber-50 px-6 py-8 text-amber-900 shadow-sm">
      <h1 className="font-secondary text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-amber-800">{message}</p>
    </div>
  );
}
