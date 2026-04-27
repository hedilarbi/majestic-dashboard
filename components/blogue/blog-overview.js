import Link from "next/link";

import { BLOG_NAV_ITEMS } from "@/lib/blogue/constants";
import { Icon } from "@/components/ui/icons";

export default function BlogOverview({ items = [] }) {
  const counts = items.reduce((accumulator, item) => {
    const key = item?.type;
    if (!key) {
      return accumulator;
    }

    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-white/10 bg-white/80 p-8 shadow-[0_30px_80px_-50px_rgba(14,55,165,0.45)] backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary/70">
          Espace blogue
        </p>
        <h1 className="mt-3 font-secondary text-3xl font-semibold text-slate-900 sm:text-4xl">
          Gestion des contenus editoriaux
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Creez, modifiez et publiez vos articles, bandes-annonces et
          formulaires depuis un espace dedie au contenu.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {BLOG_NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="group rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_60px_-45px_rgba(15,42,120,0.45)] transition hover:-translate-y-0.5 hover:border-primary/30"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon name={item.icon} className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {counts[item.key] || 0}
              </span>
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">
              {item.label}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Accedez a la liste, creez un nouveau contenu et gardez la main sur
              la publication.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Ouvrir
              <Icon name="chevronLeft" className="h-4 w-4 rotate-180" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
