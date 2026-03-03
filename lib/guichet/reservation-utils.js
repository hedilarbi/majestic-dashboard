export const normalizeReservationResponse = (data, fallback = {}) => {
  const reservationPayload =
    data?.reservation ||
    data?.data?.reservation ||
    data?.data ||
    data?.result ||
    {};

  const reservationId =
    data?.reservationId ||
    data?.id ||
    reservationPayload?.reservationId ||
    reservationPayload?.id ||
    reservationPayload?._id ||
    data?.data?.reservationId ||
    data?.data?.id ||
    fallback.reservationId ||
    "";

  const expiresAt =
    data?.expiresAt ||
    data?.expires_at ||
    reservationPayload?.expiresAt ||
    reservationPayload?.expires_at ||
    fallback.expiresAt ||
    null;

  const seats =
    (Array.isArray(data?.seats) && data.seats) ||
    (Array.isArray(reservationPayload?.seats) && reservationPayload.seats) ||
    (Array.isArray(data?.data?.seats) && data.data.seats) ||
    fallback.seats ||
    [];

  return {
    reservationId,
    expiresAt,
    seats,
  };
};
