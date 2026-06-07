import { Icon } from "@/components/ui/icons";

const buildHref = (resource, format, queryString = "") => {
  const query = typeof queryString === "string" ? queryString : "";
  return `/api/exports/${encodeURIComponent(resource)}/${format}${
    query ? `?${query}` : ""
  }`;
};

export default function ExportButtons({ resource, queryString = "" }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={buildHref(resource, "pdf", queryString)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100"
      >
        <Icon name="download" className="h-4 w-4" />
        PDF
      </a>
      <a
        href={buildHref(resource, "excel", queryString)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
      >
        <Icon name="download" className="h-4 w-4" />
        Excel
      </a>
    </div>
  );
}
