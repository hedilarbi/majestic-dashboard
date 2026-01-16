const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const getCellKey = (row, col) => `${row}-${col}`;

const buildRowLabel = (index) => {
  let label = "";
  let current = index;

  while (current >= 0) {
    label = String.fromCharCode(65 + (current % 26)) + label;
    current = Math.floor(current / 26) - 1;
  }

  return label;
};

export const buildRowLabels = (count) => {
  const safeCount = toPositiveInt(count);
  return Array.from({ length: safeCount }, (_, index) => buildRowLabel(index));
};

export const createLayoutMap = (rows, columns) => {
  const layoutMap = {};
  const totalColumns = toPositiveInt(columns);

  rows.forEach((row) => {
    for (let col = 1; col <= totalColumns; col += 1) {
      layoutMap[getCellKey(row, col)] = "chaise";
    }
  });

  return layoutMap;
};

export const buildRoomStateFromRoom = (room) => {
  const layout = Array.isArray(room?.layout) ? room.layout : [];
  const overrides = Array.isArray(room?.overrides) ? room.overrides : [];
  const pricingOverrides = Array.isArray(room?.pricingOverrides)
    ? room.pricingOverrides
    : [];

  const rowsSet = new Set();
  let columns = 0;
  const layoutMap = {};

  layout.forEach((cell) => {
    const row = cell?.row ? String(cell.row) : "";
    const col = Number(cell?.col);

    if (!row || !Number.isFinite(col) || col <= 0) {
      return;
    }

    rowsSet.add(row);
    columns = Math.max(columns, col);
    layoutMap[getCellKey(row, col)] =
      cell?.cellType === "couloir" ? "couloir" : "chaise";
  });

  const rows = Array.from(rowsSet).sort((a, b) =>
    a.localeCompare(b, "fr", { numeric: true })
  );

  rows.forEach((row) => {
    for (let col = 1; col <= columns; col += 1) {
      const key = getCellKey(row, col);
      if (!layoutMap[key]) {
        layoutMap[key] = "chaise";
      }
    }
  });

  const staffMap = {};
  overrides.forEach((override) => {
    const row = override?.row ? String(override.row) : "";
    const col = Number(override?.col);

    if (!row || !Number.isFinite(col) || col <= 0) {
      return;
    }

    if (override?.status === "staff") {
      staffMap[getCellKey(row, col)] = true;
    }
  });

  const pricingMap = {};
  pricingOverrides.forEach((override) => {
    const row = override?.row ? String(override.row) : "";
    const col = Number(override?.col);
    const pricingId =
      override?.pricingId?._id ?? override?.pricingId ?? "";

    if (!row || !Number.isFinite(col) || col <= 0 || !pricingId) {
      return;
    }

    pricingMap[getCellKey(row, col)] = String(pricingId);
  });

  return {
    rows,
    columns,
    layoutMap,
    staffMap,
    pricingMap,
  };
};

export const buildRoomPayload = ({
  rows = [],
  columns = 0,
  layoutMap = {},
  staffMap = {},
  pricingMap = {},
}) => {
  const payload = {
    layout: [],
    overrides: [],
    pricingOverrides: [],
    capacity: 0,
  };

  rows.forEach((row) => {
    for (let col = 1; col <= columns; col += 1) {
      const key = getCellKey(row, col);
      const cellType = layoutMap[key] === "couloir" ? "couloir" : "chaise";
      payload.layout.push({ row, col, cellType });

      if (cellType === "chaise") {
        payload.capacity += 1;

        if (staffMap[key]) {
          payload.overrides.push({ row, col, status: "staff" });
        }

        const pricingId = pricingMap[key];
        if (pricingId) {
          payload.pricingOverrides.push({ row, col, pricingId });
        }
      }
    }
  });

  return payload;
};

export const countSeats = ({ rows = [], columns = 0, layoutMap = {} }) => {
  let seats = 0;

  rows.forEach((row) => {
    for (let col = 1; col <= columns; col += 1) {
      const key = getCellKey(row, col);
      const cellType = layoutMap[key] === "couloir" ? "couloir" : "chaise";
      if (cellType === "chaise") {
        seats += 1;
      }
    }
  });

  return seats;
};
