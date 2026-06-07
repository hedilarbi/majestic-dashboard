import Link from "next/link";

import DashboardAccessDenied from "@/components/dashboard/access-denied";
import FormSubmissionList from "@/components/blogue/form-submission-list";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import { getBlogFormSubmissions } from "@/services/blog-form-submissions";

export default async function DashboardFormSubmissionListPage({ params }) {
  const canList = await canAccessDashboardPermission(
    "blog_form_submissions",
    "list",
  );

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les soumissions des formulaires." />
    );
  }

  const { formId } = await params;
  const { form, items, error } = await getBlogFormSubmissions(formId);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Link
        href="/soumissions-formulaires"
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
      >
        ← Retour aux formulaires
      </Link>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {form ? (
        <FormSubmissionList
          form={form}
          items={items}
          basePath="/soumissions-formulaires"
        />
      ) : null}
    </div>
  );
}
