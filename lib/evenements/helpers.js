export const TYPE_OPTIONS = [
  { value: "movie", label: "Film" },
  { value: "show", label: "Spectacle" },
];

export const STATUS_OPTIONS = [
  { value: "active", label: "Actif" },
  { value: "inactive", label: "Inactif" },
  { value: "archived", label: "Archivé" },
];

export const VERSION_OPTIONS = [
  { value: "VO", label: "VO" },
  { value: "VF", label: "VF" },
  { value: "VOSTFR", label: "VOSTFR" },
];

export const GENRE_OPTIONS = [
  { value: "Action", label: "Action" },
  { value: "Aventure", label: "Aventure" },
  { value: "Comedie", label: "Comédie" },
  { value: "Drame", label: "Drame" },
  { value: "Horreur", label: "Horreur" },
  { value: "Thriller", label: "Thriller" },
  { value: "Science-fiction", label: "Science-fiction" },
  { value: "Fantastique", label: "Fantastique" },
  { value: "Animation", label: "Animation" },
  { value: "Documentaire", label: "Documentaire" },
  { value: "Romance", label: "Romance" },
  { value: "Famille", label: "Famille" },
  { value: "Historique", label: "Historique" },
  { value: "Musical", label: "Musical" },
  { value: "Crime", label: "Crime" },
];

export const TYPE_LABELS = TYPE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

export const GENRE_LABELS = GENRE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

export const STATUS_LABELS = STATUS_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

export const STATUS_STYLES = {
  active: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
  },
  inactive: {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
  archived: {
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    dot: "bg-amber-500",
  },
};

export const TYPE_STYLES = {
  movie: "bg-blue-50 text-blue-700",
  show: "bg-pink-50 text-pink-700",
};

export const INPUT_CLASSES =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

export const TEXTAREA_CLASSES =
  "w-full min-h-[140px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none";

export const INITIAL_FORM = {
  type: "movie",
  name: "",
  description: "",
  trailerLink: "",
  duration: "",
  ageRestriction: "",
  genres: [],
  availableVersions: [],
  releaseDate: "",
  directedBy: "",
  cast: "",
  availableFrom: "",
  availableTo: "",
  status: "active",
};

export const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const toDateInputValue = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (segment) => String(segment).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
};

export const toDateTimeInputValue = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (segment) => String(segment).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const splitList = (value) => {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const formatSelectedGenres = (genres) => {
  if (!Array.isArray(genres) || genres.length === 0) {
    return "Sélectionner des genres";
  }

  const labels = genres.map((genre) => GENRE_LABELS[genre] || genre);

  if (labels.length <= 2) {
    return labels.join(", ");
  }

  return `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`;
};

export const buildEventFormData = (state, posterFile) => {
  const formData = new FormData();

  formData.append("type", state.type);
  formData.append("name", state.name.trim());
  formData.append("status", state.status);

  const description = state.description.trim();
  if (description) {
    formData.append("description", description);
  }

  if (posterFile) {
    formData.append("poster", posterFile);
  }

  const trailerLink = state.trailerLink.trim();
  if (trailerLink) {
    formData.append("trailerLink", trailerLink);
  }

  const duration = Number.parseInt(state.duration, 10);
  if (Number.isFinite(duration)) {
    formData.append("duration", String(duration));
  }

  const ageRestriction = state.ageRestriction.trim();
  if (ageRestriction) {
    formData.append("ageRestriction", ageRestriction);
  }

  const genres = Array.isArray(state.genres)
    ? state.genres
    : splitList(state.genres);
  genres.forEach((genre) => {
    formData.append("genres", genre);
  });

  const availableVersions = Array.isArray(state.availableVersions)
    ? state.availableVersions
    : [];
  availableVersions.forEach((version) => {
    formData.append("availableVersions", version);
  });

  if (state.releaseDate) {
    formData.append("releaseDate", state.releaseDate);
  }

  const directedBy = state.directedBy.trim();
  if (directedBy) {
    formData.append("directedBy", directedBy);
  }

  splitList(state.cast).forEach((member) => {
    formData.append("cast", member);
  });

  if (state.availableFrom) {
    formData.append("availableFrom", state.availableFrom);
  }

  if (state.availableTo) {
    formData.append("availableTo", state.availableTo);
  }

  return formData;
};
