import Link from "next/link";

import DashboardAccessDenied from "@/components/dashboard/access-denied";
import FormSubmissionDetail from "@/components/blogue/form-submission-detail";
import { canAccessBlogFormSubmissions, getBlogUser } from "@/services/blog-auth";
import { getBlogFormSubmissionDetails } from "@/services/blog-form-submissions";

export default async function BlogFormSubmissionDetailPage({ params }) {
  const user = await getBlogUser();

  if (!canAccessBlogFormSubmissions(user)) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter le detail des soumissions." />
    );
  }

  const { formId, submissionId } = await params;
  const { item, error } = await getBlogFormSubmissionDetails(submissionId);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        href={`/blogue/soumissions/${formId}`}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
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
