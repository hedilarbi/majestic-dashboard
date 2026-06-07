"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/icons";
import { hasDashboardPermission } from "@/lib/dashboard-permissions";
import { useUser } from "./user-context";

const NAV_ITEMS = [
{ label: "Tableau de bord", icon: "dashboard", href: "/", module: "dashboard" },
{
  label: "Statistiques",
  icon: "activity",
  href: "/statistiques",
  module: "statistics"
},
{ label: "Événements", icon: "ticket", href: "/evenements", module: "events" },
{ label: "Séances", icon: "calendar", href: "/seances", module: "sessions" },
{ label: "Staffs", icon: "users", href: "/staffs", module: "staffs" },
{ label: "Utilisateurs", icon: "users", href: "/utilisateurs", module: "users" },
{
  label: "Demandes de réservation",
  icon: "form",
  href: "/demandes-reservation",
  module: "reservation_requests"
},
{
  label: "Caisse",
  icon: "money",
  href: "/caisse",
  module: "cash_registers"
},
{
  label: "Audit",
  icon: "activity",
  href: "/audit",
  module: "audit_logs"
}];


const BLOGUE_ITEMS = [
{
  label: "Vue d'ensemble",
  href: "/gestion-blogue",
  modules: ["blog_articles", "blog_videos", "blog_forms"],
  exact: true
},
{
  label: "Articles",
  href: "/gestion-blogue/articles",
  module: "blog_articles"
},
{
  label: "Vidéos",
  href: "/gestion-blogue/bandes-annonces",
  module: "blog_videos"
},
{
  label: "Formulaires",
  href: "/gestion-blogue/formulaires",
  module: "blog_forms"
},
{
  label: "Soumissions",
  href: "/gestion-blogue/soumissions",
  module: "blog_form_submissions"
}];


const CONFIG_ITEMS = [
{
  label: "Horaires des séances",
  href: "/configurations/horaires-seances",
  module: "session_times"
},
{ label: "Tarifs", href: "/configurations/tarifs", module: "pricing" },
{
  label: "Codes promo",
  href: "/configurations/codes-promo",
  module: "promo_codes"
},
{
  label: "Abonnements",
  href: "/configurations/abonnements",
  module: "subscriptions"
},
{ label: "Versions", href: "/configurations/versions", module: "versions" },
{
  label: "Types de spectacle",
  href: "/configurations/types-spectacle",
  module: "show_types"
},
{ label: "Affiches", href: "/configurations/affiches", module: "home_hero" },
{ label: "Partenaires", href: "/configurations/partenaires", module: "home_hero" },
{ label: "Salles", href: "/configurations/salles", module: "rooms" }];


const VENTE_ITEMS = [
{
  label: "Transactions",
  href: "/ventes/transactions",
  module: "sales_transactions"
},
{ label: "Billets", href: "/ventes/billets", module: "sales_tickets" },
{
  label: "Abonnements",
  href: "/ventes/abonnements",
  module: "sales_subscriptions"
}];


const isActivePath = (pathname, href) => {
  if (!pathname) {
    return false;
  }

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

const isItemActivePath = (pathname, item) =>
  item?.exact ? pathname === item.href : isActivePath(pathname, item.href);

const hasItemListPermission = (user, item) => {
  if (Array.isArray(item.modules)) {
    return item.modules.some((moduleKey) =>
      hasDashboardPermission(user, moduleKey, "list")
    );
  }

  return hasDashboardPermission(user, item.module, "list");
};

export default function SidebarNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const navItems = NAV_ITEMS.filter((item) =>
  hasDashboardPermission(user, item.module, "list")
  );
  const blogueItems = BLOGUE_ITEMS.filter((item) =>
  hasItemListPermission(user, item)
  );
  const configItems = CONFIG_ITEMS.filter((item) =>
  hasDashboardPermission(user, item.module, "list")
  );
  const venteItems = VENTE_ITEMS.filter((item) =>
  hasDashboardPermission(user, item.module, "list")
  );
  const isVenteActive = venteItems.some((item) =>
  isActivePath(pathname, item.href)
  );
  const isBlogueActive = blogueItems.some((item) =>
  isItemActivePath(pathname, item)
  );
  const isConfigActive = configItems.some((item) =>
  isActivePath(pathname, item.href)
  );
  const [isVenteOpen, setIsVenteOpen] = useState(isVenteActive);
  const [isBlogueOpen, setIsBlogueOpen] = useState(isBlogueActive);
  const [isConfigOpen, setIsConfigOpen] = useState(isConfigActive);

  const handleVenteToggle = (event) => {
    setIsVenteOpen(event.currentTarget.open);
  };

  const handleBlogueToggle = (event) => {
    setIsBlogueOpen(event.currentTarget.open);
  };

  const handleConfigToggle = (event) => {
    setIsConfigOpen(event.currentTarget.open);
  };

  return (
    <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
      {navItems.map((item) => {
        const isActive = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.label}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
            isActive ?
            "bg-primary/10 text-primary" :
            "text-slate-600 hover:bg-white/70 hover:text-slate-900"}`
            }
            href={item.href}
            aria-current={isActive ? "page" : undefined}>

            <Icon name={item.icon} className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>);

      })}
      {blogueItems.length ?
      <details
        className="group"
        open={isBlogueOpen || isBlogueActive}
        onToggle={handleBlogueToggle}>

          <summary
          className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer list-none [&::-webkit-details-marker]:hidden ${
          isBlogueActive ?
          "bg-primary/10 text-primary" :
          "text-slate-600 hover:bg-white/70 hover:text-slate-900"}`
          }>

            <span className="flex items-center gap-3">
              <Icon name="article" className="h-5 w-5" />
              <span>Gestion blogue</span>
            </span>
            <Icon
            name="chevronDown"
            className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />

          </summary>
          <div className="mt-1 space-y-1 pl-10">
            {blogueItems.map((item) => {
            const isActive = isItemActivePath(pathname, item);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                isActive ?
                "bg-primary/10 text-primary" :
                "text-slate-500 hover:bg-white/70 hover:text-slate-900"}`
                }
                aria-current={isActive ? "page" : undefined}>

                  {item.label}
                </Link>);

          })}
          </div>
        </details> :
      null}
      {venteItems.length ?
      <details
        className="group"
        open={isVenteOpen || isVenteActive}
        onToggle={handleVenteToggle}>

          <summary
          className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer list-none [&::-webkit-details-marker]:hidden ${
          isVenteActive ?
          "bg-primary/10 text-primary" :
          "text-slate-600 hover:bg-white/70 hover:text-slate-900"}`
          }>

            <span className="flex items-center gap-3">
              <Icon name="ticket" className="h-5 w-5" />
              <span>Vente</span>
            </span>
            <Icon
            name="chevronDown"
            className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />

          </summary>
          <div className="mt-1 space-y-1 pl-10">
            {venteItems.map((item) => {
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                isActive ?
                "bg-primary/10 text-primary" :
                "text-slate-500 hover:bg-white/70 hover:text-slate-900"}`
                }
                aria-current={isActive ? "page" : undefined}>

                  {item.label}
                </Link>);

          })}
          </div>
        </details> :
      null}
      {configItems.length ?
      <details
        className="group"
        open={isConfigOpen || isConfigActive}
        onToggle={handleConfigToggle}>

          <summary
          className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer list-none [&::-webkit-details-marker]:hidden ${
          isConfigActive ?
          "bg-primary/10 text-primary" :
          "text-slate-600 hover:bg-white/70 hover:text-slate-900"}`
          }>

            <span className="flex items-center gap-3">
              <Icon name="settings" className="h-5 w-5" />
              <span>Configuration</span>
            </span>
            <Icon
            name="chevronDown"
            className="h-4 w-4 text-slate-400 transition group-open:rotate-180" />

          </summary>
          <div className="mt-1 space-y-1 pl-10">
            {configItems.map((item) => {
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                isActive ?
                "bg-primary/10 text-primary" :
                "text-slate-500 hover:bg-white/70 hover:text-slate-900"}`
                }
                aria-current={isActive ? "page" : undefined}>

                  {item.label}
                </Link>);

          })}
          </div>
        </details> :
      null}
    </nav>);

}
