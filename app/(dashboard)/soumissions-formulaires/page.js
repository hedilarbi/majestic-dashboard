import DashboardAccessDenied from "@/components/dashboard/access-denied";
import FormSubmissionFormsList from "@/components/blogue/form-submission-forms-list";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import { getBlogSubmissionForms } from "@/services/blog-form-submissions";

export default async function DashboardFormSubmissionsPage() {
  const canList = await canAccessDashboardPermission(
    "blog_form_submissions",
    "list",
  );

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les soumissions des formulaires." />
    );
  }

  const { items, error } = await getBlogSubmissionForms();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          Soumissions de formulaires
        </h1>
        <p className="text-sm text-slate-500">
          Consultez les soumissions envoyées depuis les formulaires publiés.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <FormSubmissionFormsList
        items={items}
        basePath="/soumissions-formulaires"
      />
    </div>
  );
}
