import DashboardAccessDenied from "@/components/dashboard/access-denied";
import BlogContentManager from "@/components/blogue/blog-content-manager";
import { canManageBlogContent, getBlogUser } from "@/services/blog-auth";
import { getBlogContents } from "@/services/blog-contents";

export default async function BlogueTrailersPage() {
  const user = await getBlogUser();

  if (!canManageBlogContent(user)) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de gerer les bandes-annonces du blogue." />
    );
  }

  const { items, error } = await getBlogContents({ type: "trailer" });

  return (
    <BlogContentManager
      type="trailer"
      initialItems={items}
      initialError={error}
    />
  );
}
