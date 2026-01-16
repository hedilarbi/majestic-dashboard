"use client";

export default function Toast({ toast }) {
  if (!toast) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50" aria-live="polite">
      <div
        className={`rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
          toast.type === "error" ? "bg-red-600" : "bg-emerald-600"
        }`}
        role="status"
      >
        {toast.message}
      </div>
    </div>
  );
}
