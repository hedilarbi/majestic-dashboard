"use client";

import { useMemo } from "react";

import { useUser } from "@/components/dashboard/user-context";
import { hasDashboardPermission } from "@/lib/dashboard-permissions";

export const useDashboardModulePermissions = (moduleKey) => {
  const { user } = useUser();

  return useMemo(
    () => ({
      canList: hasDashboardPermission(user, moduleKey, "list"),
      canCreate: hasDashboardPermission(user, moduleKey, "create"),
      canUpdate: hasDashboardPermission(user, moduleKey, "update"),
      canDelete: hasDashboardPermission(user, moduleKey, "delete"),
      hasAny:
        hasDashboardPermission(user, moduleKey, "list") ||
        hasDashboardPermission(user, moduleKey, "create") ||
        hasDashboardPermission(user, moduleKey, "update") ||
        hasDashboardPermission(user, moduleKey, "delete"),
    }),
    [moduleKey, user],
  );
};
