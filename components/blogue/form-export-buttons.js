"use client";

import { useState } from "react";

const getCookie = (name) => {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : "";
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function FormExportButtons({ formId }) {
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async (format) => {
    const setLoading = format === "excel" ? setLoadingExcel : setLoadingPdf;
    setLoading(true);
    setError("");

    try {
      const token = getCookie("auth_token");
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
      const response = await fetch(
        `${baseUrl}/blog-form-submissions/forms/${formId}/submissions/export/${format}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (!response.ok) {
        setError("Export impossible. Vérifiez vos permissions.");
        return;
      }

      const blob = await response.blob();
      const ext = format === "excel" ? "xlsx" : "pdf";
      downloadBlob(blob, `soumissions-formulaire.${ext}`);
    } catch (_err) {
      setError("Une erreur est survenue lors de l'export.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error ? (
        <p className="w-full text-xs text-red-500">{error}</p>
      ) : null}
      <button
        type="button"
        onClick={() => handleExport("excel")}
        disabled={loadingExcel}
        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
      >
        {loadingExcel ? "Export..." : "Exporter Excel"}
      </button>
      <button
        type="button"
        onClick={() => handleExport("pdf")}
        disabled={loadingPdf}
        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
      >
        {loadingPdf ? "Export..." : "Exporter PDF"}
      </button>
    </div>
  );
}
