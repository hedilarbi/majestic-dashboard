import DashboardAccessDenied from "@/components/dashboard/access-denied";
import BlogContentManager from "@/components/blogue/blog-content-manager";
import { getBlogContents } from "@/services/blog-contents";
import { getDashboardBlogContentPermissions } from "@/services/blog-dashboard-auth";

export default async function DashboardBlogueArticlesPage() {
  const permissions = await getDashboardBlogContentPermissions("article");

  if (!permissions.canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de gerer les articles du blogue." />
    );
  }

  const { items, error } = await getBlogContents({ type: "article" });

  return (
    <BlogContentManager
      type="article"
      initialItems={items}
      initialError={error}
      permissions={permissions}
    />
  );
}
