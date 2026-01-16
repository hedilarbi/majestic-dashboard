"use client";

import { Icon } from "@/components/ui/icons";
import { useUser } from "./user-context";

const getInitials = (firstName, lastName) => {
  const firstInitial = firstName?.[0] ?? "";
  const lastInitial = lastName?.[0] ?? "";
  const initials = `${firstInitial}${lastInitial}`.trim();
  return initials || "AA";
};

export default function DashboardHeader() {
  const { user, isLoading } = useUser();
  const firstName = user?.firstName ?? "";
  const lastName = user?.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim();
  const displayName = fullName || (isLoading ? "Chargement..." : "Utilisateur");
  const role = user?.role || (isLoading ? "..." : "Role inconnu");
  const initials = getInitials(firstName, lastName);

  return (
    <header className="h-16 flex items-center justify-end px-6 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center gap-4">
        <button className="p-2 relative text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Icon name="bell" className="h-5 w-5" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-red-500 border-2 border-white" />
        </button>
        <div className="h-8 w-px bg-slate-200 mx-1" />
        <button className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 transition-colors">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 leading-none">
              {displayName}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{role}</p>
          </div>
          <div className="size-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm font-semibold">
            {initials}
          </div>
        </button>
      </div>
    </header>
  );
}
