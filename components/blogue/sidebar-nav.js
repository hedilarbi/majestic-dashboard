"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BLOG_NAV_ITEMS } from "@/lib/blogue/constants";
import { hasDashboardPermission } from "@/lib/dashboard-permissions";
import { Icon } from "@/components/ui/icons";
import { useUser } from "@/components/dashboard/user-context";

const isActivePath = (pathname, href) => {
  if (!pathname) {
    return false;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function BlogueSidebarNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const canManageContent =
    user?.role === "blog_manager" || user?.role === "super_admin";
  const canViewSubmissions =
    canManageContent ||
    hasDashboardPermission(user, "blog_form_submissions", "list");

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
      {canManageContent ? (
        <Link
          href="/blogue"
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            pathname === "/blogue"
              ? "bg-primary/10 text-primary"
              : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
          }`}
        >
          <Icon name="dashboard" className="h-5 w-5" />
          <span>Vue d&apos;ensemble</span>
        </Link>
      ) : null}
      {canManageContent
        ? BLOG_NAV_ITEMS.map((item) => {
        const isActive = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.key}
            href={item.href}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon name={item.icon} className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
        })
        : null}
      {canViewSubmissions ? (
        <Link
          href="/blogue/soumissions"
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            isActivePath(pathname, "/blogue/soumissions")
              ? "bg-primary/10 text-primary"
              : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
          }`}
        >
          <Icon name="form" className="h-5 w-5" />
          <span>Soumissions</span>
        </Link>
      ) : null}
    </nav>
  );
}
