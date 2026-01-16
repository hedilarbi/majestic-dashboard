const toNumber = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const normalizePosterUrl = (poster, baseUrl) => {
  if (!poster || typeof poster !== "string") {
    return "";
  }

  if (/^https?:\/\//i.test(poster)) {
    return poster;
  }

  if (!baseUrl) {
    return poster;
  }

  if (poster.startsWith("/")) {
    return `${baseUrl}${poster}`;
  }

  return `${baseUrl}/${poster}`;
};

export const normalizeEvents = (payload, baseUrl) => {
  const items = Array.isArray(payload)
    ? payload
    : payload?.events || payload?.data || payload?.items || [];

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      id: item?._id ?? item?.id ?? "",
      name: item?.name ?? "",
      type: item?.type ?? "movie",
      status: item?.status ?? "active",
      description: item?.description ?? "",
      poster: normalizePosterUrl(item?.poster ?? "", baseUrl),
      trailerLink: item?.trailerLink ?? "",
      duration: item?.duration ?? null,
      ageRestriction: item?.ageRestriction ?? "",
      genres: Array.isArray(item?.genres) ? item.genres : [],
      availableVersions: Array.isArray(item?.availableVersions)
        ? item.availableVersions
        : [],
      releaseDate: item?.releaseDate ?? null,
      directedBy: item?.directedBy ?? "",
      cast: Array.isArray(item?.cast) ? item.cast : [],
      availableFrom: item?.availableFrom ?? null,
      availableTo: item?.availableTo ?? null,
    }))
    .filter((item) => item.id && item.name);
};

export const normalizeEvent = (payload, baseUrl) => {
  const event = payload?.event || payload?.data || payload;

  if (!event || !(event._id || event.id)) {
    return null;
  }

  return {
    id: event._id ?? event.id,
    name: event.name ?? "",
    type: event.type ?? "movie",
    status: event.status ?? "active",
    description: event.description ?? "",
    poster: normalizePosterUrl(event.poster ?? "", baseUrl),
    trailerLink: event.trailerLink ?? "",
    duration: event.duration ?? null,
    ageRestriction: event.ageRestriction ?? "",
    genres: Array.isArray(event.genres) ? event.genres : [],
    availableVersions: Array.isArray(event.availableVersions)
      ? event.availableVersions
      : [],
    releaseDate: event.releaseDate ?? null,
    directedBy: event.directedBy ?? "",
    cast: Array.isArray(event.cast) ? event.cast : [],
    availableFrom: event.availableFrom ?? null,
    availableTo: event.availableTo ?? null,
  };
};

export const normalizePagination = (payload, page, limit, itemCount) => {
  const meta =
    payload?.pagination ||
    payload?.meta ||
    payload?.pageInfo ||
    payload?.paging ||
    {};

  const total = toNumber(
    payload?.total ??
      payload?.count ??
      meta?.total ??
      meta?.totalItems ??
      meta?.totalCount ??
      meta?.count
  );

  const currentPage = toPositiveInt(
    payload?.page ?? meta?.page ?? meta?.currentPage,
    page
  );

  const pageSize = toPositiveInt(
    payload?.limit ?? meta?.limit ?? meta?.perPage ?? meta?.pageSize,
    limit
  );

  const pagesFromPayload = toPositiveInt(
    payload?.pages ?? meta?.pages ?? meta?.totalPages ?? meta?.pageCount,
    null
  );

  const pagesFromTotal = Number.isFinite(total)
    ? Math.max(1, Math.ceil(total / pageSize))
    : null;

  const totalPages =
    pagesFromPayload && pagesFromTotal
      ? Math.max(pagesFromPayload, pagesFromTotal)
      : pagesFromPayload || pagesFromTotal;

  const hasNext =
    typeof payload?.hasNext === "boolean"
      ? payload.hasNext
      : typeof meta?.hasNext === "boolean"
      ? meta.hasNext
      : totalPages
      ? currentPage < totalPages
      : itemCount >= pageSize;

  const hasPrev =
    typeof payload?.hasPrev === "boolean"
      ? payload.hasPrev
      : typeof meta?.hasPrev === "boolean"
      ? meta.hasPrev
      : currentPage > 1;

  return {
    page: currentPage,
    limit: pageSize,
    total: Number.isFinite(total) ? total : null,
    totalPages,
    hasNext,
    hasPrev,
  };
};

const toValidDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatTime = (date) =>
  date
    ? date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const formatSessionDate = (date) =>
  date
    ? date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const getSessionDateTime = (session) => {
  const candidate =
    session.startTime ||
    session.startsAt ||
    session.dateTime ||
    session.datetime ||
    session.date ||
    session.sessionDate ||
    session.showtime;

  const date = toValidDate(candidate);

  if (date) {
    return date;
  }

  const dayValue = session.date || session.sessionDate || session.day;
  if (!dayValue) {
    return null;
  }

  const baseDate = toValidDate(dayValue);
  if (!baseDate) {
    return null;
  }

  const timeValue =
    session.sessionTime || session.time || session.start || session.hour;
  if (typeof timeValue === "string") {
    const [hours, minutes] = timeValue.split(":").map(Number);
    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      baseDate.setHours(hours, minutes, 0, 0);
    }
  }

  return baseDate;
};

const getSessionFormat = (session) =>
  session.format || session.version || session.language || session.type || "-";

const clampPercent = (value) => {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
};

const getSessionOccupancy = (session) => {
  const direct =
    session.occupation ?? session.occupancy ?? session.fillRate ?? session.rate;

  const numeric = clampPercent(
    typeof direct === "string" ? Number.parseFloat(direct) : direct
  );

  if (numeric !== null) {
    return numeric;
  }

  const sold =
    session.ticketsSold ??
    session.soldSeats ??
    session.bookedSeats ??
    null;
  const capacity =
    session.capacity ?? session.totalSeats ?? session.seats ?? null;
  const available =
    session.availableSeats ??
    session.remainingSeats ??
    session.seatsAvailable ??
    null;

  if (
    Number.isFinite(available) &&
    Number.isFinite(capacity) &&
    capacity > 0
  ) {
    return clampPercent(((capacity - available) / capacity) * 100);
  }

  if (Number.isFinite(sold) && Number.isFinite(capacity) && capacity > 0) {
    return clampPercent((sold / capacity) * 100);
  }

  return null;
};

const SESSION_STATUS_MAP = {
  pending: {
    label: "En attente",
    color: "text-amber-600",
    dot: "bg-amber-500",
  },
  in_progress: {
    label: "En cours",
    color: "text-blue-600",
    dot: "bg-blue-500",
  },
  "in-progress": {
    label: "En cours",
    color: "text-blue-600",
    dot: "bg-blue-500",
  },
  open: { label: "Ouvert", color: "text-emerald-600", dot: "bg-emerald-500" },
  active: { label: "Ouvert", color: "text-emerald-600", dot: "bg-emerald-500" },
  available: {
    label: "Ouvert",
    color: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  full: { label: "Complet", color: "text-rose-600", dot: "bg-rose-500" },
  soldout: {
    label: "Complet",
    color: "text-rose-600",
    dot: "bg-rose-500",
  },
  complete: {
    label: "Complet",
    color: "text-rose-600",
    dot: "bg-rose-500",
  },
  completed: {
    label: "Terminée",
    color: "text-slate-500",
    dot: "bg-slate-400",
  },
  closed: {
    label: "Fermé",
    color: "text-slate-500",
    dot: "bg-slate-400",
  },
  cancelled: {
    label: "Annulé",
    color: "text-red-600",
    dot: "bg-red-500",
  },
  canceled: {
    label: "Annulé",
    color: "text-red-600",
    dot: "bg-red-500",
  },
  scheduled: {
    label: "Programmé",
    color: "text-slate-500",
    dot: "bg-slate-400",
  },
  planned: {
    label: "Programmé",
    color: "text-slate-500",
    dot: "bg-slate-400",
  },
  upcoming: {
    label: "Programmé",
    color: "text-slate-500",
    dot: "bg-slate-400",
  },
};

const formatSessionStatus = (value) => {
  if (!value) {
    return {
      label: "Programmé",
      color: "text-slate-500",
      dot: "bg-slate-400",
    };
  }

  const key = String(value).toLowerCase();
  if (SESSION_STATUS_MAP[key]) {
    return SESSION_STATUS_MAP[key];
  }

  return {
    label: key.charAt(0).toUpperCase() + key.slice(1),
    color: "text-slate-500",
    dot: "bg-slate-400",
  };
};

export const normalizeSessions = (payload) => {
  const items = Array.isArray(payload)
    ? payload
    : payload?.sessions || payload?.data || payload?.items || [];

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((session) => {
      const id = session?._id ?? session?.id;
      if (!id) {
        return null;
      }

      const statusValue = session?.status || session?.state || "scheduled";
      const dateValue = session?.date || session?.sessionDate || null;
      const sessionTime =
        session?.sessionTime || session?.time || session?.start || "";
      const eventData =
        session?.event ||
        (session?.eventId && typeof session.eventId === "object"
          ? session.eventId
          : null);
      const roomData =
        session?.room ||
        (session?.roomId && typeof session.roomId === "object"
          ? session.roomId
          : null);
      const eventId =
        eventData?._id ??
        eventData?.id ??
        (typeof session?.eventId === "string"
          ? session.eventId
          : typeof session?.eventId === "number"
          ? String(session.eventId)
          : "");
      const roomId =
        roomData?._id ??
        roomData?.id ??
        (typeof session?.roomId === "string"
          ? session.roomId
          : typeof session?.roomId === "number"
          ? String(session.roomId)
          : "");

      const dateTime = getSessionDateTime({
        ...session,
        sessionTime,
      });
      const occupancy = getSessionOccupancy(session);

      return {
        id,
        eventId,
        eventName: eventData?.name ?? session?.eventName ?? "",
        date: dateValue,
        sessionTime,
        version: session?.version ?? "",
        roomId,
        roomName: roomData?.name ?? session?.roomName ?? "",
        totalSeats: session?.totalSeats ?? null,
        availableSeats: session?.availableSeats ?? null,
        pricingLimits: Array.isArray(session?.pricingLimits)
          ? session.pricingLimits
          : [],
        overrides: Array.isArray(session?.overrides) ? session.overrides : [],
        pricingOverrides: Array.isArray(session?.pricingOverrides)
          ? session.pricingOverrides
          : [],
        status: statusValue,
        createdBy: session?.createdBy ?? null,
        createdAt: session?.createdAt ?? null,
        updatedAt: session?.updatedAt ?? null,
        dateLabel: formatSessionDate(dateTime),
        timeLabel: sessionTime || formatTime(dateTime),
        format: getSessionFormat(session),
        occupancy,
        statusMeta: formatSessionStatus(statusValue),
      };
    })
    .filter(Boolean);
};

export const normalizeRooms = (payload) => {
  const items = Array.isArray(payload)
    ? payload
    : payload?.rooms || payload?.data || payload?.items || [];

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((room) => {
      const id = room?._id ?? room?.id ?? "";
      const name = room?.name ?? "";

      if (!id || !name) {
        return null;
      }

      const capacity = Number.isFinite(room?.capacity) ? room.capacity : null;
      const layout = Array.isArray(room?.layout) ? room.layout : [];
      const overrides = Array.isArray(room?.overrides) ? room.overrides : [];
      const pricingOverrides = Array.isArray(room?.pricingOverrides)
        ? room.pricingOverrides
        : [];

      const normalizedLayout = layout
        .map((cell) => ({
          row: cell?.row ? String(cell.row) : "",
          col: Number(cell?.col),
          cellType: cell?.cellType ?? "chaise",
        }))
        .filter((cell) => cell.row && Number.isFinite(cell.col));

      const normalizedOverrides = overrides
        .map((override) => ({
          row: override?.row ? String(override.row) : "",
          col: Number(override?.col),
          status: override?.status ?? "",
        }))
        .filter((override) => override.row && Number.isFinite(override.col));

      const normalizedPricingOverrides = pricingOverrides
        .map((override) => ({
          row: override?.row ? String(override.row) : "",
          col: Number(override?.col),
          pricingId: override?.pricingId?._id ?? override?.pricingId ?? "",
        }))
        .filter((override) => override.row && Number.isFinite(override.col));

      return {
        id,
        name,
        capacity,
        layout: normalizedLayout,
        overrides: normalizedOverrides,
        pricingOverrides: normalizedPricingOverrides,
      };
    })
    .filter(Boolean);
};

export const buildEventsQuery = ({ page, limit, name, type, status }) => {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (name) {
    params.set("name", name);
  }

  if (type) {
    params.set("type", type);
  }

  if (status) {
    params.set("status", status);
  }

  return params.toString();
};
