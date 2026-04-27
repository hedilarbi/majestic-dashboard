"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/icons";

const NAV_ITEMS = [
  {
    label: "Guichets",
    icon: "users",
    href: "/caissier",
  },
  {
    label: "Historique",
    icon: "clock",
    href: "/caissier/historique",
  },
];

const isActivePath = (pathname, href) => {
  if (!pathname) {
    return false;
  }

  if (href === "/caissier") {
    return pathname === href || pathname.startsWith("/caissier/guichets/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function CashierSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
      {NAV_ITEMS.map((item) => {
        const isActive = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
            }`}
          >
            <Icon name={item.icon} className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
