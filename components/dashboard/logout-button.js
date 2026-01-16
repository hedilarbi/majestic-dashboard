"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/components/ui/icons";
import { clearUserCache } from "./user-context";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      clearUserCache();
      router.replace("/connexion");
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors disabled:opacity-60"
      disabled={isLoading}
    >
      <Icon name="logout" className="h-5 w-5" />
      <span>{isLoading ? "Deconnexion..." : "Deconnexion"}</span>
    </button>
  );
}
