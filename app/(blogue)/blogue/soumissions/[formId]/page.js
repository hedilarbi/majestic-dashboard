import Link from "next/link";

import DashboardAccessDenied from "@/components/dashboard/access-denied";
import FormSubmissionList from "@/components/blogue/form-submission-list";
import FormStatsPanel from "@/components/blogue/form-stats-panel";
import { canAccessBlogFormSubmissions, getBlogUser } from "@/services/blog-auth";
import { getBlogFormSubmissions } from "@/services/blog-form-submissions";

export default async function BlogFormSubmissionListPage({ params }) {
  const user = await getBlogUser();

  if (!canAccessBlogFormSubmissions(user)) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les soumissions des formulaires." />
    );
  }

  const { formId } = await params;
  const { form, items, error } = await getBlogFormSubmissions(formId);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        href="/blogue/soumissions"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-primary"
      >
        ← Retour aux formulaires
      </Link>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {form ? (
        <>
          <FormStatsPanel formId={formId} />
          <FormSubmissionList form={form} items={items} />
        </>
      ) : null}
    </div>
  );
}
