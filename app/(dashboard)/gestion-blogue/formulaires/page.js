import DashboardAccessDenied from "@/components/dashboard/access-denied";
import BlogContentManager from "@/components/blogue/blog-content-manager";
import { getBlogContents } from "@/services/blog-contents";
import { getDashboardBlogContentPermissions } from "@/services/blog-dashboard-auth";

export default async function DashboardBlogueFormsPage() {
  const permissions = await getDashboardBlogContentPermissions("form");

  if (!permissions.canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de gerer les formulaires du blogue." />
    );
  }

  const { items, error } = await getBlogContents({ type: "form" });

  return (
    <BlogContentManager
      type="form"
      initialItems={items}
      initialError={error}
      permissions={permissions}
    />
  );
}
