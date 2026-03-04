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

  const browserOrigin =
    typeof window !== "undefined" ? String(window.location.origin || "") : "";
  const input = String(raw).trim();
  if (!input) {
    return browserOrigin.replace(/\/$/, "");
  }

  if (input.startsWith("/")) {
    return browserOrigin.replace(/\/$/, "");
  }

  const normalizedInput = input.replace(/^wss?:\/\//i, (match) =>
    match.toLowerCase() === "wss://" ? "https://" : "http://",
  );
  const hasProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(normalizedInput);
  const baseForRelative = browserOrigin || undefined;
  const safeInput = hasProtocol ? normalizedInput : `https://${normalizedInput}`;

  try {
    const parsed = new URL(safeInput, baseForRelative);

    if (typeof window !== "undefined") {
      const pageProtocol = String(window.location.protocol || "").toLowerCase();
      if (pageProtocol === "https:" && parsed.protocol === "http:") {
        parsed.protocol = "https:";
      }

      const pageHost = String(window.location.hostname || "").toLowerCase();
      const socketHost = String(parsed.hostname || "").toLowerCase();
      const isLocalLikeHost =
        socketHost === "localhost" ||
        socketHost === "0.0.0.0" ||
        socketHost.startsWith("127.") ||
        socketHost.endsWith(".local") ||
        !socketHost.includes(".");

      if (pageHost && socketHost && pageHost !== socketHost && isLocalLikeHost) {
        return browserOrigin.replace(/\/$/, "");
      }
    }

    return parsed.origin.replace(/\/$/, "");
  } catch (_error) {
    return browserOrigin.replace(/\/$/, "");
  }
};
