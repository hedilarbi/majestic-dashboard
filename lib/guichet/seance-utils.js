import { formatDisplayDate } from "@/lib/guichet/time-utils";

export const resolveSeanceInfo = (data) => {
  const session = data?.session || data?.seance || data || {};
  const eventFromSession =
    session?.event ||
    (session?.eventId && typeof session.eventId === "object"
      ? session.eventId
      : null);
  const event = data?.event || eventFromSession || {};

  const title =
    event?.name ||
    event?.nom ||
    event?.title ||
    session?.eventName ||
    session?.title ||
    data?.eventName;

  const poster =
    event?.poster ||
    event?.affiche ||
    event?.image ||
    session?.poster ||
    data?.poster;

  const rawDate = session?.date || data?.date;
  const date = formatDisplayDate(rawDate);
  const time = session?.sessionTime || session?.time || data?.sessionTime;

  const room =
    session?.room?.name ||
    session?.roomName ||
    session?.roomId ||
    session?.room ||
    data?.room;

  return {
    title: title,
    poster: poster,
    date: date,
    time: time,
    room: room,
  };
};

export const resolvePricingItems = (data) => {
  const session = data?.session || data?.seance || data || {};
  const limits = Array.isArray(session?.pricingLimits)
    ? session.pricingLimits
    : Array.isArray(data?.pricingLimits)
      ? data.pricingLimits
      : [];

  if (!limits.length) {
    return [];
  }

  return limits
    .map((limit) => {
      const pricingSource =
        (limit?.pricingId && typeof limit.pricingId === "object"
          ? limit.pricingId
          : null) ||
        limit?.pricing ||
        limit?.tarif ||
        {};

      const name =
        pricingSource?.name ||
        pricingSource?.nom ||
        limit?.name ||
        limit?.label ||
        "";
      const description =
        pricingSource?.description ||
        pricingSource?.details ||
        limit?.description ||
        "";
      const price = pricingSource?.price ?? limit?.price ?? null;
      const id =
        pricingSource?._id ??
        pricingSource?.id ??
        (typeof limit?.pricingId === "string" ? limit.pricingId : null) ??
        limit?._id ??
        limit?.id ??
        name;

      if (!name && price === null) {
        return null;
      }

      return {
        id: id || name,
        name: name || "Tarif",
        description,
        price,
      };
    })
    .filter(Boolean);
};
