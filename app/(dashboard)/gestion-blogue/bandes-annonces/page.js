import DashboardAccessDenied from "@/components/dashboard/access-denied";
import BlogContentManager from "@/components/blogue/blog-content-manager";
import { getBlogContents } from "@/services/blog-contents";
import { getDashboardBlogContentPermissions } from "@/services/blog-dashboard-auth";

export default async function DashboardBlogueTrailersPage() {
  const permissions = await getDashboardBlogContentPermissions("trailer");

  if (!permissions.canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de gérer les vidéos du blogue." />
    );
  }

  const { items, error } = await getBlogContents({ type: "trailer" });

  return (
    <BlogContentManager
      type="trailer"
      initialItems={items}
      initialError={error}
      permissions={permissions}
    />
  );
}
