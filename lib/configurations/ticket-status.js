export const getTicketStatusMeta = (ticketOrIsScanned) => {
  let status = "active";

  if (typeof ticketOrIsScanned === "boolean") {
    status = ticketOrIsScanned ? "scanned" : "active";
  } else if (ticketOrIsScanned && typeof ticketOrIsScanned === "object") {
    const explicitStatus = String(ticketOrIsScanned.status || "")
      .trim()
      .toLowerCase();

    if (explicitStatus === "cancelled") {
      status = "cancelled";
    } else if (explicitStatus === "scanned") {
      status = "scanned";
    } else if (typeof ticketOrIsScanned.isScanned === "boolean") {
      status = ticketOrIsScanned.isScanned ? "scanned" : "active";
    } else {
      const legacyStatus = String(ticketOrIsScanned.status || "").toLowerCase();
      status = legacyStatus === "scanned" ? "scanned" : "active";
    }
  } else {
    const legacyStatus = String(ticketOrIsScanned || "").toLowerCase();
    status =
      legacyStatus === "cancelled"
        ? "cancelled"
        : legacyStatus === "scanned"
          ? "scanned"
          : "active";
  }

  if (status === "cancelled") {
    return {
      code: "cancelled",
      label: "Annule",
      tone: "bg-red-50 text-red-700 border-red-200",
    };
  }

  if (status === "scanned") {
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
