"use client";

import { Icon } from "@/components/ui/icons";

export default function Modal({
  title,
  description,
  children,
  onClose,
  maxWidth = "max-w-md",
  containerClassName = "",
  bodyClassName = "",
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 py-6"
      role="dialog"
      aria-modal="true"
      onClick={() => (onClose ? onClose() : null)}
    >
      <div
        className={`w-full ${maxWidth} rounded-2xl bg-white p-6 shadow-2xl ${containerClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-secondary text-xl font-semibold text-slate-900">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Fermer"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <div className={bodyClassName}>{children}</div>
      </div>
    </div>
  );
}
