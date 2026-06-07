import "server-only";

import { hasDashboardPermission } from "@/lib/dashboard-permissions";
import { getDashboardUser } from "@/services/dashboard-auth";

export const BLOG_CONTENT_PERMISSION_MODULES = {
  article: "blog_articles",
  trailer: "blog_videos",
  form: "blog_forms",
};

export const getDashboardBlogOverviewAccess = async () => {
  const user = await getDashboardUser();
  const allowedTypes = Object.entries(BLOG_CONTENT_PERMISSION_MODULES).
    filter(([, moduleKey]) =>
      hasDashboardPermission(user, moduleKey, "list")
    ).
    map(([type]) => type);

  return {
    canList: allowedTypes.length > 0,
    allowedTypes,
  };
};

export const getDashboardBlogContentPermissions = async (type) => {
  const user = await getDashboardUser();
  const moduleKey = BLOG_CONTENT_PERMISSION_MODULES[type] || "";

  return {
    canList: hasDashboardPermission(user, moduleKey, "list"),
    canCreate: hasDashboardPermission(user, moduleKey, "create"),
    canUpdate: hasDashboardPermission(user, moduleKey, "update"),
    canDelete: hasDashboardPermission(user, moduleKey, "delete"),
  };
};

export const canAccessDashboardBlogSubmissions = async () => {
  const user = await getDashboardUser();

  return hasDashboardPermission(user, "blog_form_submissions", "list");
};
