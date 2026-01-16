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

export const parseEventsSearchParams = (searchParams) => {
  const page = toPositiveInt(getParamValue(searchParams?.page), 1);
  const limit = toPositiveInt(getParamValue(searchParams?.limit), 10);
  const name = normalizeStringParam(getParamValue(searchParams?.name));
  const type = normalizeStringParam(getParamValue(searchParams?.type));
  const status = normalizeStringParam(getParamValue(searchParams?.status));

  return {
    page,
    limit,
    name,
    type,
    status,
  };
};
