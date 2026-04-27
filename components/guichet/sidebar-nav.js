"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/icons";

const NAV_ITEMS = [
  {
    label: "Vente de billet",
    icon: "ticket",
    href: "/guichet/vente-de-billet",
  },
  {
    label: "Abonnement",
    icon: "users",
    href: "/guichet/abonnements",
  },
  {
    label: "Caisse",
    icon: "money",
    href: "/guichet/caisse",
  },
  {
    label: "Historique",
    icon: "clock",
    href: "/guichet/historique",
  },
];

const isActivePath = (pathname, href) => {
  if (!pathname) {
    return false;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function GuichetSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.label}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
            }`}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon name={item.icon} className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
