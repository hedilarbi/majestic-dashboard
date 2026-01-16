"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const buildHref = (searchParams, page, limit) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set("page", String(page));
  params.set("limit", String(limit));
  const query = params.toString();
  return query ? `/seances?${query}` : "/seances";
};

const buildPageItems = (current, totalPages) => {
  if (!totalPages || totalPages <= 1) {
    return [1];
  }

  const pages = new Set([1, totalPages, current, current - 1, current + 1]);
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items = [];
  sorted.forEach((page, index) => {
    if (index > 0) {
      const previous = sorted[index - 1];
      if (page - previous > 1) {
        items.push("...");
      }
    }
    items.push(page);
  });

  return items;
};

export default function SeancesPagination({
  page,
  limit,
  total,
  totalPages,
  hasNext,
  hasPrev,
}) {
  const searchParams = useSearchParams();

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;
  const pagesFromTotal =
    Number.isFinite(total) && total > 0
      ? Math.ceil(total / safeLimit)
      : null;

  const derivedTotalPages =
    Number.isFinite(totalPages) && totalPages > 0 && pagesFromTotal
      ? Math.max(totalPages, pagesFromTotal)
      : Number.isFinite(totalPages) && totalPages > 0
      ? totalPages
      : pagesFromTotal;

  const canPrev = typeof hasPrev === "boolean" ? hasPrev : safePage > 1;
  const canNext =
    typeof hasNext === "boolean"
      ? hasNext
      : derivedTotalPages
      ? safePage < derivedTotalPages
      : false;

  const pageItems = buildPageItems(safePage, derivedTotalPages);
  const prevHref = buildHref(searchParams, safePage - 1, safeLimit);
  const nextHref = buildHref(searchParams, safePage + 1, safeLimit);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-sm text-slate-500">
        Page {safePage}
        {derivedTotalPages ? ` / ${derivedTotalPages}` : ""}
        {Number.isFinite(total) ? ` · ${total} séances` : ""}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {canPrev ? (
          <Link
            href={prevHref}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Précédent
          </Link>
        ) : (
          <span className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-400 opacity-60">
            Précédent
          </span>
        )}
        <div className="flex items-center gap-1">
          {pageItems.map((item, index) => {
            if (item === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-sm text-slate-400"
                >
                  ...
                </span>
              );
            }

            const pageNumber = item;
            const isActive = pageNumber === safePage;
            const href = buildHref(searchParams, pageNumber, safeLimit);

            return (
              <Link
                key={`page-${pageNumber}`}
                href={href}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {pageNumber}
              </Link>
            );
          })}
        </div>
        {canNext ? (
          <Link
            href={nextHref}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Suivant
          </Link>
        ) : (
          <span className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-400 opacity-60">
            Suivant
          </span>
        )}
      </div>
    </div>
  );
}
