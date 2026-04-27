import Image from "next/image";
import { redirect } from "next/navigation";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import LogoutButton from "@/components/dashboard/logout-button";
import { UserProvider } from "@/components/dashboard/user-context";
import GuichetSidebarNav from "@/components/guichet/sidebar-nav";
import { getAuthContext } from "@/services/api";

const redirectToConnexion = () => {
  redirect("/api/auth/logout?redirect=/connexion");
};

const getGuichetUser = async () => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    if (auth.message === "Configuration serveur manquante.") {
      throw new Error(auth.message);
    }
    redirectToConnexion();
  }

  let response;

  try {
    response = await fetch(`${auth.baseUrl}/staff/me`, {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: "no-store",
    });
  } catch {
    redirectToConnexion();
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    redirectToConnexion();
  }

  const role = data?.user?.role;

  if (role === "admin" || role === "super_admin") {
    redirect("/");
  }

  if (role === "blog_manager") {
    redirect("/blogue");
  }

  if (role === "cashier") {
    redirect("/caissier");
  }

  if (!data?.user || role !== "ticket_office") {
    redirectToConnexion();
  }

  return data?.user ?? null;
};

export default async function GuichetLayout({ children }) {
  const user = await getGuichetUser();

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-accent/10 text-foreground flex flex-col md:flex-row">
      <aside className="w-full md:w-64 md:h-screen flex-shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 bg-white/90 backdrop-blur">
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-100 justify-center">
          <Image
            src="/images/logo.png"
            alt="Logo Majestic"
            width={140}
            height={48}
            className="h-14 w-auto "
            priority
          />
        </div>
        <GuichetSidebarNav />
        <div className="p-4 border-t border-slate-200">
          <LogoutButton />
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full min-w-0 min-h-0">
        <UserProvider initialUser={user}>
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth min-h-0">
            {children}
          </main>
        </UserProvider>
      </div>
    </div>
  );
}
