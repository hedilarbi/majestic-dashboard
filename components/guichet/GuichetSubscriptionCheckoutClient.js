"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Icon } from "@/components/ui/icons";
import { formatDate, formatPrice } from "@/lib/configurations/formatters";

const INPUT_CLASSES =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const normalizeText = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const normalizeEmail = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
};

const isValidEmail = (value) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function GuichetSubscriptionCheckoutClient({
  subscriptionId,
  subscription,
}) {
  const router = useRouter();
  const [formState, setFormState] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [submitState, setSubmitState] = useState({
    status: "idle",
    message: "",
    sale: null,
  });

  const isSubmitting = submitState.status === "loading";

  const subscriptionSummary = useMemo(
    () => ({
      name: subscription?.name || "Abonnement",
      price: formatPrice(subscription?.price),
      crédits:
        Number.isFinite(subscription?.totalCredits) &&
        Number(subscription.totalCredits) >= 0
          ? String(subscription.totalCredits)
          : "-",
      expirationDate: subscription?.expirationDate
        ? formatDate(subscription.expirationDate)
        : "-",
      description: subscription?.description || "",
    }),
    [subscription],
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const firstName = normalizeText(formState.firstName);
    const lastName = normalizeText(formState.lastName);
    const email = normalizeEmail(formState.email);

    if (!firstName || !lastName || !isValidEmail(email) || !subscriptionId) {
      setSubmitState({
        status: "error",
        message: "Le nom, le prénom et un email valide sont obligatoires.",
        sale: null,
      });
      return;
    }

    setSubmitState({
      status: "loading",
      message: "",
      sale: null,
    });

    try {
      const response = await fetch("/api/guichet/subscription-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId,
          customerContact: {
            firstName,
            lastName,
            email,
          },
          paymentMethod: "cash",
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data?.message || "Impossible de finaliser la vente de l'abonnement.",
        );
      }

      setSubmitState({
        status: "success",
        message: "Vente d'abonnement confirmée.",
        sale: data?.sale || null,
      });
    } catch (error) {
      setSubmitState({
        status: "error",
        message:
          error?.message || "Impossible de finaliser la vente de l'abonnement.",
        sale: null,
      });
    }
  };

  if (submitState.status === "success") {
    return (
      <section className="lg:col-span-8 space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
          {submitState.message}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Vente terminee
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {subscriptionSummary.name}
              </h2>
            </div>
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Icon name="ticket" className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Client
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {normalizeText(formState.firstName)}{" "}
                {normalizeText(formState.lastName)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {normalizeEmail(formState.email)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Code abonnement
              </p>
              <p className="mt-2 break-all text-lg font-semibold tracking-[0.12em] text-slate-900">
                {submitState.sale?.subscriptionCode || "-"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {subscriptionSummary.price} • {subscriptionSummary.crédits}{" "}
                crédits
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/guichet/abonnements"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Nouvelle vente
            </Link>
            <button
              type="button"
              onClick={() => router.push("/guichet/vente-de-billet")}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Retour au guichet
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="lg:col-span-8 space-y-6">
      {submitState.status === "error" ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {submitState.message}
        </div>
      ) : null}

      <form
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Checkout abonnement
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Vendre un abonnement
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Renseigne l&apos;identite du client avant de confirmer la vente.
            </p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Icon name="users" className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Prénom</span>
            <input
              name="firstName"
              type="text"
              value={formState.firstName}
              onChange={handleInputChange}
              className={INPUT_CLASSES}
              placeholder="Prénom du client"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Nom</span>
            <input
              name="lastName"
              type="text"
              value={formState.lastName}
              onChange={handleInputChange}
              className={INPUT_CLASSES}
              placeholder="Nom du client"
            />
          </label>
        </div>

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            name="email"
            type="email"
            value={formState.email}
            onChange={handleInputChange}
            className={INPUT_CLASSES}
            placeholder="client@email.com"
          />
        </label>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/guichet/abonnements"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition ${
              isSubmitting
                ? "cursor-not-allowed bg-slate-200 text-slate-400"
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            {isSubmitting ? "Confirmation..." : "Confirmer la vente"}
          </button>
        </div>
      </form>
    </section>
  );
}
