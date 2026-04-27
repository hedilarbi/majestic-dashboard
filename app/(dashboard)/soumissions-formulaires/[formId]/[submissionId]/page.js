import Link from "next/link";

import DashboardAccessDenied from "@/components/dashboard/access-denied";
import FormSubmissionDetail from "@/components/blogue/form-submission-detail";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import { getBlogFormSubmissionDetails } from "@/services/blog-form-submissions";

export default async function DashboardFormSubmissionDetailPage({ params }) {
  const canList = await canAccessDashboardPermission(
    "blog_form_submissions",
    "list",
  );

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter le detail des soumissions." />
    );
  }

  const { formId, submissionId } = await params;
  const { item, error } = await getBlogFormSubmissionDetails(submissionId);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        href={`/soumissions-formulaires/${formId}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-primary"
      >
        ← Retour aux soumissions
      </Link>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {item ? <FormSubmissionDetail item={item} /> : null}
    </div>
  );
}
