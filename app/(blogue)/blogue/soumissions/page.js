import Link from "next/link";

import DashboardAccessDenied from "@/components/dashboard/access-denied";
import FormSubmissionFormsList from "@/components/blogue/form-submission-forms-list";
import { canAccessBlogFormSubmissions, getBlogUser } from "@/services/blog-auth";
import { getBlogSubmissionForms } from "@/services/blog-form-submissions";

export default async function BlogFormSubmissionsPage() {
  const user = await getBlogUser();
  const canManage = user?.role === "blog_manager" || user?.role === "super_admin";

  if (!canAccessBlogFormSubmissions(user)) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les soumissions des formulaires." />
    );
  }

  const { items, error } = await getBlogSubmissionForms();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Blogue
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Soumissions de formulaires
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Consultez les formulaires publiés et les candidatures envoyées
            depuis l&apos;espace client.
          </p>
        </div>
        {canManage ? (
          <Link
            href="/blogue/formulaires"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-primary hover:text-primary"
          >
            Voir les formulaires
          </Link>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <FormSubmissionFormsList items={items} />
    </div>
  );
}
