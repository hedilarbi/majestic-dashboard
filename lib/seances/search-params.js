const getParamValue = (value) =>
  Array.isArray(value) ? value[0] : value;

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeStringParam = (value) => {
  if (!value || typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : "";
};

const normalizeDateParam = (value) => {
  if (!value || typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? "" : trimmed;
};

export const parseSessionsSearchParams = (searchParams) => {
  const page = toPositiveInt(getParamValue(searchParams?.page), 1);
  const limit = toPositiveInt(getParamValue(searchParams?.limit), 10);
  const status = normalizeStringParam(getParamValue(searchParams?.status));
  const from = normalizeDateParam(getParamValue(searchParams?.from));
  const to = normalizeDateParam(getParamValue(searchParams?.to));

  return {
    page,
    limit,
    status: status === "Tous" ? "" : status,
    from,
    to,
  };
};
