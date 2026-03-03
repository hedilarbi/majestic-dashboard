export const fetchSeatMap = async (seanceId, { signal } = {}) => {
  const response = await fetch(`/api/guichet/sessions/${seanceId}/seat-map`, {
    signal,
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
};
