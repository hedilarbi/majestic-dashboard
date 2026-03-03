export const formatTimeLeft = (value) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "00:00";
  }

  const totalSeconds = Math.ceil(value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}`;
};

export const getExpiresAtMs = (expiresAt) => {
  if (!expiresAt) {
    return null;
  }

  if (typeof expiresAt === "number") {
    return expiresAt;
  }

  const parsed = Date.parse(expiresAt);
  return Number.isFinite(parsed) ? parsed : null;
};

export const formatDisplayDate = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
