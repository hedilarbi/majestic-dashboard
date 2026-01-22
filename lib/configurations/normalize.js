export const normalizeSessionTimes = (payload) => {
  const items = Array.isArray(payload)
    ? payload
    : payload?.sessionTimes ||
      payload?.data ||
      payload?.items ||
      payload?.sessionTime ||
      [];

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      id: item?._id ?? item?.id ?? "",
      time: item?.time ?? "",
      createdAt: item?.createdAt ?? null,
      updatedAt: item?.updatedAt ?? null,
    }))
    .filter((item) => item.id && item.time);
};

export const normalizeVersions = (payload) => {
  const items = Array.isArray(payload)
    ? payload
    : payload?.versions ||
      payload?.languages ||
      payload?.data ||
      payload?.items ||
      [];

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      id: item?._id ?? item?.id ?? "",
      name: item?.name ?? "",
      createdAt: item?.createdAt ?? null,
      updatedAt: item?.updatedAt ?? null,
    }))
    .filter((item) => item.id && item.name);
};

export const normalizeShowTypes = (payload) => {
  const items = Array.isArray(payload)
    ? payload
    : payload?.showTypes || payload?.data || payload?.items || [];

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      id: item?._id ?? item?.id ?? "",
      name: item?.name ?? "",
      createdAt: item?.createdAt ?? null,
      updatedAt: item?.updatedAt ?? null,
    }))
    .filter((item) => item.id && item.name);
};

export const normalizeHomeHero = (payload, baseUrl) => {
  const items = Array.isArray(payload)
    ? payload
    : payload?.homeHero || payload?.data || payload?.items || [];

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const id = item?._id ?? item?.id ?? "";
      let poster = item?.poster ?? "";
      if (poster && typeof poster === "string" && baseUrl) {
        if (!/^https?:\/\//i.test(poster)) {
          poster = poster.startsWith("/") ? `${baseUrl}${poster}` : `${baseUrl}/${poster}`;
        }
      }
      const eventData =
        item?.event ||
        (item?.eventId && typeof item.eventId === "object"
          ? item.eventId
          : null);
      const eventId =
        eventData?._id ??
        eventData?.id ??
        (typeof item?.eventId === "string"
          ? item.eventId
          : typeof item?.eventId === "number"
          ? String(item.eventId)
          : "");

      if (!id) {
        return null;
      }

      return {
        id,
        poster,
        active: item?.active !== false,
        eventAffiche: item?.eventAffiche === true,
        order: Number.isFinite(item?.order) ? item.order : null,
        title: item?.title ?? "",
        subtitle: item?.subtitle ?? "",
        eventId,
        eventName: eventData?.name ?? "",
        createdAt: item?.createdAt ?? null,
        updatedAt: item?.updatedAt ?? null,
      };
    })
    .filter(Boolean);
};

export const normalizeAfficheCinema = (payload, baseUrl) => {
  const items = Array.isArray(payload)
    ? payload
    : payload?.aLaffiche || payload?.items || payload?.data || [];

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const id = item?._id ?? item?.id ?? "";
      let poster = item?.poster ?? "";

      if (poster && typeof poster === "string" && baseUrl) {
        if (!/^https?:\/\//i.test(poster)) {
          poster = poster.startsWith("/")
            ? `${baseUrl}${poster}`
            : `${baseUrl}/${poster}`;
        }
      }

      const eventData =
        item?.event ||
        (item?.eventId && typeof item.eventId === "object"
          ? item.eventId
          : null);
      const eventId =
        eventData?._id ??
        eventData?.id ??
        (typeof item?.eventId === "string"
          ? item.eventId
          : typeof item?.eventId === "number"
          ? String(item.eventId)
          : "");

      if (!id) {
        return null;
      }

      return {
        id,
        eventId,
        eventName: eventData?.name ?? "",
        poster,
        createdAt: item?.createdAt ?? null,
        updatedAt: item?.updatedAt ?? null,
      };
    })
    .filter(Boolean);
};

export const normalizePricing = (payload) => {
  const items = Array.isArray(payload)
    ? payload
    : payload?.pricing || payload?.data || payload?.items || [];

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      id: item?._id ?? item?.id ?? "",
      name: item?.name ?? "",
      price: item?.price ?? null,
      createdAt: item?.createdAt ?? null,
      updatedAt: item?.updatedAt ?? null,
    }))
    .filter((item) => item.id && item.name);
};

export const normalizeRooms = (payload) => {
  const items = Array.isArray(payload)
    ? payload
    : payload?.rooms || payload?.data || payload?.items || [];

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      id: item?._id ?? item?.id ?? "",
      name: item?.name ?? "",
      capacity: item?.capacity ?? null,
      layout: Array.isArray(item?.layout) ? item.layout : [],
      overrides: Array.isArray(item?.overrides) ? item.overrides : [],
      pricingOverrides: Array.isArray(item?.pricingOverrides)
        ? item.pricingOverrides
        : [],
      createdAt: item?.createdAt ?? null,
      updatedAt: item?.updatedAt ?? null,
    }))
    .filter((item) => item.id && item.name);
};
