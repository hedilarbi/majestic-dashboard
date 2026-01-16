"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ConnexionPage() {
  const router = useRouter();
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!formState.email || !formState.password) {
      setErrorMessage("Veuillez renseigner l'email et le mot de passe.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: formState.email,
          password: formState.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data?.message || "Erreur de connexion.");
        return;
      }

      if (data?.user?.role !== "admin") {
        setErrorMessage("Acces refuse.");
        return;
      }

      router.replace("/");
    } catch (error) {
      setErrorMessage("Impossible de se connecter. Verifiez votre connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/15 via-white to-primary/10 px-6 py-12 text-foreground">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-8">
        <Image
          src="/images/logo.png"
          alt="Logo Majestic"
          width={160}
          height={160}
          className="h-20 w-auto"
          priority
        />
        <section className="w-full">
          <div className="rounded-3xl border border-primary/15 bg-white/90 p-8 shadow-[0_24px_70px_-40px_rgba(16,52,166,0.6)] backdrop-blur">
            <h1 className="mb-6 text-center font-secondary text-3xl font-semibold text-primary sm:text-4xl">
              Connexion
            </h1>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formState.email}
                  onChange={handleChange}
                  placeholder="nom@domaine.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="password"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formState.password}
                    onChange={handleChange}
                    placeholder="Votre mot de passe"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-primary"
                  >
                    {showPassword ? (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      >
                        <path d="M3 3l18 18" />
                        <path d="M10.7 10.7a2.5 2.5 0 003.6 3.6" />
                        <path d="M9.9 5.1A10.4 10.4 0 0112 5c5 0 9 4 10 7-0.4 1.2-1.2 2.6-2.4 3.9" />
                        <path d="M6.1 6.1C4 7.6 2.6 9.7 2 12c1 3 5 7 10 7 1.6 0 3.1-0.4 4.4-1" />
                      </svg>
                    ) : (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {errorMessage ? (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
