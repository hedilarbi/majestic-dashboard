"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/icons";

const NAV_ITEMS = [
  { label: "Tableau de bord", icon: "dashboard", href: "/" },
  { label: "Evenements", icon: "ticket", href: "/evenements" },
  { label: "Seances", icon: "calendar", href: "/seances" },
  { label: "Staffs", icon: "users", href: "/staffs" },
];

const CONFIG_ITEMS = [
  { label: "Horaires des séances", href: "/configurations/horaires-seances" },
  { label: "Tarifs", href: "/configurations/tarifs" },
  { label: "Codes promo", href: "/configurations/codes-promo" },
  { label: "Abonnements", href: "/configurations/abonnements" },
  { label: "Versions", href: "/configurations/versions" },
  { label: "Types de spectacle", href: "/configurations/types-spectacle" },
  { label: "Affiches", href: "/configurations/affiches" },

  { label: "Salles", href: "/configurations/salles" },
];

const VENTE_ITEMS = [
  { label: "Transactions", href: "/ventes/transactions" },
  { label: "Billets", href: "/ventes/billets" },
  { label: "Abonnements", href: "/ventes/abonnements" },
];

const isActivePath = (pathname, href) => {
  if (!pathname) {
    return false;
  }

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function SidebarNav() {
  const pathname = usePathname();
  const isVenteActive = VENTE_ITEMS.some((item) =>
    isActivePath(pathname, item.href),
  );
  const isConfigActive = CONFIG_ITEMS.some((item) =>
    isActivePath(pathname, item.href),
  );
  const [isVenteOpen, setIsVenteOpen] = useState(isVenteActive);
  const [isConfigOpen, setIsConfigOpen] = useState(isConfigActive);

  useEffect(() => {
    if (isVenteActive) {
      setIsVenteOpen(true);
    }
    if (isConfigActive) {
      setIsConfigOpen(true);
    }
  }, [isConfigActive, isVenteActive]);

  const handleVenteToggle = (event) => {
    setIsVenteOpen(event.currentTarget.open);
  };

  const handleConfigToggle = (event) => {
    setIsConfigOpen(event.currentTarget.open);
  };

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
      <details
        className="group"
        open={isVenteOpen}
        onToggle={handleVenteToggle}
      >
        <summary
          className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer list-none [&::-webkit-details-marker]:hidden ${
            isVenteActive
              ? "bg-primary/10 text-primary"
              : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
          }`}
        >
          <span className="flex items-center gap-3">
            <Icon name="ticket" className="h-5 w-5" />
            <span>Vente</span>
          </span>
          <Icon
            name="chevronDown"
            className="h-4 w-4 text-slate-400 transition group-open:rotate-180"
          />
        </summary>
        <div className="mt-1 space-y-1 pl-10">
          {VENTE_ITEMS.map((item) => {
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </details>
      <details
        className="group"
        open={isConfigOpen}
        onToggle={handleConfigToggle}
      >
        <summary
          className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer list-none [&::-webkit-details-marker]:hidden ${
            isConfigActive
              ? "bg-primary/10 text-primary"
              : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
          }`}
        >
          <span className="flex items-center gap-3">
            <Icon name="settings" className="h-5 w-5" />
            <span>Configuration</span>
          </span>
          <Icon
            name="chevronDown"
            className="h-4 w-4 text-slate-400 transition group-open:rotate-180"
          />
        </summary>
        <div className="mt-1 space-y-1 pl-10">
          {CONFIG_ITEMS.map((item) => {
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </details>
    </nav>
  );
}
