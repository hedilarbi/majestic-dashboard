import DashboardAccessDenied from "@/components/dashboard/access-denied";
import BlogOverview from "@/components/blogue/blog-overview";
import { getBlogContents } from "@/services/blog-contents";
import { getDashboardBlogOverviewAccess } from "@/services/blog-dashboard-auth";

export default async function DashboardBloguePage() {
  const access = await getDashboardBlogOverviewAccess();

  if (!access.canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission d'accéder à la gestion du blogue." />
    );
  }

  const results = await Promise.all(
    access.allowedTypes.map((type) => getBlogContents({ type }))
  );
  const items = results.flatMap((result) => result.items);
  const error = results.find((result) => result.error)?.error || "";

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <BlogOverview
        items={items}
        basePath="/gestion-blogue"
        allowedTypes={access.allowedTypes}
      />
    </div>
  );
}
