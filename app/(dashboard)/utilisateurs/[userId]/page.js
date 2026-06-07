import DashboardAccessDenied from "@/components/dashboard/access-denied";
import { canAccessDashboardPermission } from "@/services/dashboard-auth";
import UserDetailsClient from "./user-details-client";
import { getUserDetails } from "@/services/users";
import Link from "next/link";
import { Icon } from "@/components/ui/icons";

export default async function UserDetailsPage({ params }) {
  const canList = await canAccessDashboardPermission("users", "list");

  if (!canList) {
    return (
      <DashboardAccessDenied message="Vous n'avez pas la permission de consulter les détails de l'utilisateur." />
    );
  }

  const { userId } = await params;
  const response = await getUserDetails(userId);

  if (!response.ok) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Utilisateur introuvable</h2>
        <p className="text-slate-500 mt-2">{response.message}</p>
        <Link href="/utilisateurs" className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90">
          <Icon name="chevronLeft" className="h-4 w-4" />
          Retour à la liste
        </Link>
      </div>
    );
  }

  return <UserDetailsClient user={response.user} bookings={response.bookings} subscriptions={response.subscriptions} />;
}
