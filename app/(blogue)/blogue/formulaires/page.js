import DashboardAccessDenied from "@/components/dashboard/access-denied";
import BlogContentManager from "@/components/blogue/blog-content-manager";
import { canManageBlogContent, getBlogUser } from "@/services/blog-auth";
import { getBlogContents } from "@/services/blog-contents";

export default async function BlogueFormsPage() {
  const user = await getBlogUser();

  if (!canManageBlogContent(user)) {
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
    />
  );
}
