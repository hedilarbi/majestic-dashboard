export const BLOG_CONTENT_TYPES = {
  article: {
    key: "article",
    label: "Articles",
    singular: "article",
    icon: "article",
    href: "/blogue/articles",
    emptyMessage: "Aucun article de blogue n'a encore ete publie.",
  },
  trailer: {
    key: "trailer",
    label: "Vidéos",
    singular: "vidéo",
    icon: "video",
    href: "/blogue/bandes-annonces",
    emptyMessage: "Aucune vidéo n'a encore été publiée.",
  },
  form: {
    key: "form",
    label: "Formulaires",
    singular: "formulaire",
    icon: "form",
    href: "/blogue/formulaires",
    emptyMessage: "Aucun formulaire n'a encore ete créé.",
  },
};

export const BLOG_NAV_ITEMS = [
  BLOG_CONTENT_TYPES.article,
  BLOG_CONTENT_TYPES.trailer,
  BLOG_CONTENT_TYPES.form,
];

export const FORM_QUESTION_TYPE_OPTIONS = [
  { value: "text", label: "Texte" },
  { value: "textarea", label: "Zone de texte" },
  { value: "email", label: "Email" },
  { value: "number", label: "Nombre" },
  { value: "radio", label: "Choix unique" },
  { value: "checkbox", label: "Choix multiple" },
  { value: "select", label: "Liste deroulante" },
];

export const OPTION_BASED_QUESTION_TYPES = new Set([
  "radio",
  "checkbox",
  "select",
]);

export const BLOGUE_REVALIDATE_PATHS = [
  "/blogue",
  "/blogue/articles",
  "/blogue/bandes-annonces",
  "/blogue/formulaires",
  "/blogue/soumissions",
  "/gestion-blogue",
  "/gestion-blogue/articles",
  "/gestion-blogue/bandes-annonces",
  "/gestion-blogue/formulaires",
  "/gestion-blogue/soumissions",
];
