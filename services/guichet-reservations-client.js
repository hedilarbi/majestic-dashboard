export const reserveSeats = async ({ sessionId, seats, action }) => {
  const payload = { sessionId, seats };
  if (action) {
    payload.action = action;
  }
  const response = await fetch("/api/guichet/reservations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
};

export const cancelReservation = async (reservationId) => {
  const response = await fetch(
    `/api/guichet/reservations/${reservationId}`,
    {
      method: "DELETE",
    },
  );

  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
};
