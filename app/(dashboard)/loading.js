export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-accent/10 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="h-4 w-40 rounded-full bg-slate-200 animate-pulse" />
            <div className="h-3 w-56 rounded-full bg-slate-100 animate-pulse" />
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <div className="h-3 w-full rounded-full bg-slate-100 animate-pulse" />
          <div className="h-3 w-11/12 rounded-full bg-slate-100 animate-pulse" />
          <div className="h-3 w-9/12 rounded-full bg-slate-100 animate-pulse" />
        </div>

        <p className="mt-6 text-sm text-slate-500">
          Chargement en cours, veuillez patienter...
        </p>
      </div>
    </div>
  );
}
