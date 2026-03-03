export const seatKey = (row, col) => `${row}-${col}`;

export const getSeatStatus = (status) => {
  if (!status) {
    return "available";
  }

  const normalized = String(status).toLowerCase();
  const allowed = [
    "available",
    "reserved",
    "booked",
    "blocked",
    "staff",
    "aisle",
  ];
  return allowed.includes(normalized) ? normalized : "available";
};

export const isAisleCell = (cell) => {
  if (!cell) {
    return false;
  }

  const cellType = String(cell.cellType ?? cell.type ?? "").toLowerCase();
  const status = String(cell.status ?? "").toLowerCase();

  return cellType === "couloir" || cellType === "aisle" || status === "aisle";
};

export const normalizeSeatsPayload = (payload) => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.seats)) {
    return payload.seats;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  return [];
};

export const buildSeatRows = (seatMap = []) => {
  const rowsMap = new Map();
  let maxCols = 0;

  seatMap.forEach((cell) => {
    if (!cell) {
      return;
    }

    const rowValue = cell.row ?? "";
    const rowKey = String(rowValue);
    let rowEntry = rowsMap.get(rowKey);

    if (!rowEntry) {
      rowEntry = {
        rowValue,
        columns: new Map(),
        maxCol: 0,
      };
      rowsMap.set(rowKey, rowEntry);
    }

    let colNumber = Number(cell.col);
    if (!Number.isFinite(colNumber) || colNumber <= 0) {
      colNumber = rowEntry.columns.size + 1;
    }

    rowEntry.columns.set(colNumber, cell);
    if (colNumber > rowEntry.maxCol) {
      rowEntry.maxCol = colNumber;
    }

    if (colNumber > maxCols) {
      maxCols = colNumber;
    }
  });

  const rowEntries = Array.from(rowsMap.values());
  const numericRows = rowEntries.every((row) =>
    Number.isFinite(Number(row.rowValue)),
  );

  rowEntries.sort((a, b) => {
    if (numericRows) {
      return Number(a.rowValue) - Number(b.rowValue);
    }

    return String(a.rowValue).localeCompare(String(b.rowValue), "fr", {
      numeric: true,
      sensitivity: "base",
    });
  });

  const rows = rowEntries.map((rowEntry) => {
    const cells = Array.from({ length: maxCols }, () => null);

    rowEntry.columns.forEach((cell, colNumber) => {
      const index = Math.max(0, colNumber - 1);
      if (index < cells.length) {
        cells[index] = cell;
      }
    });

    return {
      label: String(rowEntry.rowValue),
      rowValue: rowEntry.rowValue,
      cells,
    };
  });

  const indexByKey = new Map();
  rows.forEach((row, rowIndex) => {
    row.cells.forEach((cell, colIndex) => {
      if (!cell) {
        return;
      }

      if (isAisleCell(cell)) {
        return;
      }

      indexByKey.set(seatKey(cell.row, cell.col), { rowIndex, colIndex });
    });
  });

  return { rows, maxCols, indexByKey };
};
