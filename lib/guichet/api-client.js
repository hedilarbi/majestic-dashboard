export const apiUrl = (path) => {
  if (!path) {
    return "";
  }

  if (path.startsWith("http")) {
    return path;
  }

  const base =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  if (!base) {
    return path;
  }

  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  console.log({ normalizedBase, normalizedPath });
  return `${normalizedBase}${normalizedPath}`;
};

export const resolveSocketUrl = (serverSocketUrl = "") => {
  const raw =
    serverSocketUrl ||
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");

  if (!raw) {
    return "";
  }

  return String(raw).replace(/\/$/, "");
};
