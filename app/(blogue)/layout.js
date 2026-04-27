import Image from "next/image";

import DashboardHeader from "@/components/dashboard/dashboard-header";
import LogoutButton from "@/components/dashboard/logout-button";
import { UserProvider } from "@/components/dashboard/user-context";
import BlogueSidebarNav from "@/components/blogue/sidebar-nav";
import { getBlogUser } from "@/services/blog-auth";

export default async function BlogueLayout({ children }) {
  const user = await getBlogUser();

  return (
    <UserProvider initialUser={user}>
      <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-white to-accent/10 text-foreground md:flex-row">
        <aside className="flex w-full flex-shrink-0 flex-col border-b border-slate-200 bg-white/90 backdrop-blur md:h-screen md:w-72 md:border-b-0 md:border-r">
          <div className="flex h-16 items-center justify-center gap-3 border-b border-slate-100 px-6">
            <Image
              src="/images/logo.png"
              alt="Logo Majestic"
              width={140}
              height={48}
              className="h-14 w-auto"
              priority
            />
          </div>
          <BlogueSidebarNav />
          <div className="border-t border-slate-200 p-4">
            <LogoutButton />
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
        </div>
      </div>
    </UserProvider>
  );
}
