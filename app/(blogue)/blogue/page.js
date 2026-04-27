import DashboardAccessDenied from "@/components/dashboard/access-denied";
import BlogOverview from "@/components/blogue/blog-overview";
import { canManageBlogContent, getBlogUser } from "@/services/blog-auth";
import { getBlogContents } from "@/services/blog-contents";

export default async function BloguePage() {
  const user = await getBlogUser();

  if (!canManageBlogContent(user)) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission d'accéder à la gestion du blogue." />
    );
  }

  const { items, error } = await getBlogContents();

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <BlogOverview items={items} />
    </div>
  );
}
