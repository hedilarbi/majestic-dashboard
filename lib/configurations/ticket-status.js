export const getTicketStatusMeta = (ticketOrIsScanned) => {
  let isScanned = false;

  if (typeof ticketOrIsScanned === "boolean") {
    isScanned = ticketOrIsScanned;
  } else if (ticketOrIsScanned && typeof ticketOrIsScanned === "object") {
    if (typeof ticketOrIsScanned.isScanned === "boolean") {
      isScanned = ticketOrIsScanned.isScanned;
    } else {
      const legacyStatus = String(ticketOrIsScanned.status || "").toLowerCase();
      isScanned = legacyStatus === "scanned";
    }
  } else {
    const legacyStatus = String(ticketOrIsScanned || "").toLowerCase();
    isScanned = legacyStatus === "scanned";
  }

  if (isScanned) {
    return {
      code: "scanned",
      label: "Scanne",
      tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }

  return {
    code: "not_scanned",
    label: "Non scanne",
    tone: "bg-blue-50 text-blue-700 border-blue-200",
  };
};
