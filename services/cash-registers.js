import "server-only";

import { getAuthContext } from "@/services/api";

const extractMessage = (data, fallback) => data?.message || fallback;

export const getCashierOverview = async () => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return { ok: false, cashierBalance: null, ticketOffices: [], message: auth.message };
  }

  const response = await fetch(`${auth.baseUrl}/cash-registers/overview`, {
    headers: { Authorization: `Bearer ${auth.token}` },
    cache: "no-store"
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      cashierBalance: null,
      ticketOffices: [],
      message: extractMessage(data, "Impossible de charger les caisses.")
    };
  }

  return {
    ok: true,
    cashier: data?.cashier || null,
    cashierBalance: data?.cashierBalance || {
      totalAmount: 0,
      closureCount: 0,
      bookingCount: 0,
      ticketCount: 0,
      subscriptionSaleCount: 0
    },
    ticketOffices: Array.isArray(data?.ticketOffices) ? data.ticketOffices : [],
    message: ""
  };
};

export const getSupervisorCashierOverview = async () => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return { ok: false, cashiers: [], message: auth.message };
  }

  const response = await fetch(`${auth.baseUrl}/cash-registers/cashiers`, {
    headers: { Authorization: `Bearer ${auth.token}` },
    cache: "no-store"
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      cashiers: [],
      message: extractMessage(data, "Impossible de charger les caisses caissiers.")
    };
  }

  return {
    ok: true,
    cashiers: Array.isArray(data?.cashiers) ? data.cashiers : [],
    message: ""
  };
};

export const getCashierTicketOfficeDetails = async (staffId) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return { ok: false, details: null, message: auth.message };
  }

  if (!staffId) {
    return { ok: false, details: null, message: "Guichet manquant." };
  }

  const response = await fetch(
    `${auth.baseUrl}/cash-registers/guichets/${encodeURIComponent(staffId)}`,
    {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: "no-store"
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      details: null,
      message: extractMessage(data, "Impossible de charger le détail du guichet.")
    };
  }

  return {
    ok: true,
    details: {
      staff: data?.staff || null,
      currentBalance: data?.currentBalance || {
        amount: 0,
        saleCount: 0,
        bookingCount: 0,
        ticketCount: 0,
        subscriptionSaleCount: 0,
        lastTransactionAt: null
      },
      lastClosure: data?.lastClosure || null,
      pendingPeriods: Array.isArray(data?.pendingPeriods) ?
      data.pendingPeriods :
      [],
      transactions: Array.isArray(data?.transactions) ? data.transactions : [],
      subscriptionSales: Array.isArray(data?.subscriptionSales) ?
      data.subscriptionSales :
      []
    },
    message: ""
  };
};

export const getTicketOfficeOwnRegisterDetails = async () => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return { ok: false, details: null, message: auth.message };
  }

  const response = await fetch(`${auth.baseUrl}/cash-registers/me`, {
    headers: { Authorization: `Bearer ${auth.token}` },
    cache: "no-store"
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      details: null,
      message: extractMessage(data, "Impossible de charger votre caisse.")
    };
  }

  return {
    ok: true,
    details: {
      staff: data?.staff || null,
      currentBalance: data?.currentBalance || {
        amount: 0,
        saleCount: 0,
        bookingCount: 0,
        ticketCount: 0,
        subscriptionSaleCount: 0,
        lastTransactionAt: null
      },
      lastClosure: data?.lastClosure || null,
      pendingPeriods: Array.isArray(data?.pendingPeriods) ?
      data.pendingPeriods :
      [],
      transactions: Array.isArray(data?.transactions) ? data.transactions : [],
      subscriptionSales: Array.isArray(data?.subscriptionSales) ?
      data.subscriptionSales :
      []
    },
    message: ""
  };
};

export const getSupervisorCashierDetails = async (cashierId) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return { ok: false, details: null, message: auth.message };
  }

  if (!cashierId) {
    return { ok: false, details: null, message: "Caissier manquant." };
  }

  const response = await fetch(
    `${auth.baseUrl}/cash-registers/cashiers/${encodeURIComponent(cashierId)}`,
    {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: "no-store"
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      details: null,
      message: extractMessage(data, "Impossible de charger le détail du caissier.")
    };
  }

  return {
    ok: true,
    details: {
      staff: data?.staff || null,
      currentBalance: data?.currentBalance || {
        amount: 0,
        transferCount: 0,
        bookingCount: 0,
        ticketCount: 0,
        subscriptionSaleCount: 0,
        lastTransferAt: null
      },
      lastClosure: data?.lastClosure || null,
      transfers: Array.isArray(data?.transfers) ? data.transfers : [],
      ticketItems: Array.isArray(data?.ticketItems) ? data.ticketItems : [],
      subscriptionSales: Array.isArray(data?.subscriptionSales) ?
      data.subscriptionSales :
      []
    },
    message: ""
  };
};

export const getSupervisorCashierClosureHistory = async ({
  limit = 200,
  dateFrom = "",
  dateTo = "",
} = {}) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return { ok: false, items: [], message: auth.message };
  }

  const query = new URLSearchParams();
  query.set("limit", String(limit));
  if (dateFrom) {
    query.set("dateFrom", dateFrom);
  }
  if (dateTo) {
    query.set("dateTo", dateTo);
  }

  const response = await fetch(
    `${auth.baseUrl}/cash-registers/cashiers/history?${query.toString()}`,
    {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: "no-store"
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      items: [],
      message: extractMessage(data, "Impossible de charger l'historique des caisses.")
    };
  }

  return {
    ok: true,
    items: Array.isArray(data?.items) ? data.items : [],
    message: ""
  };
};

export const getCashierHistory = async ({ limit = 200 } = {}) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return { ok: false, items: [], cashierBalance: null, message: auth.message };
  }

  const response = await fetch(
    `${auth.baseUrl}/cash-registers/history?limit=${encodeURIComponent(limit)}`,
    {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: "no-store"
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      items: [],
      cashierBalance: null,
      message: extractMessage(data, "Impossible de charger l'historique.")
    };
  }

  return {
    ok: true,
    items: Array.isArray(data?.items) ? data.items : [],
    cashierBalance: data?.cashierBalance || {
      totalAmount: 0,
      closureCount: 0,
      bookingCount: 0,
      ticketCount: 0,
      subscriptionSaleCount: 0
    },
    message: ""
  };
};

export const getCashierClosureDetails = async (closureId) => {
  const auth = await getAuthContext();

  if (!auth.ok) {
    return { ok: false, closure: null, message: auth.message };
  }

  if (!closureId) {
    return { ok: false, closure: null, message: "Clôture manquante." };
  }

  const response = await fetch(
    `${auth.baseUrl}/cash-registers/history/${encodeURIComponent(closureId)}`,
    {
      headers: { Authorization: `Bearer ${auth.token}` },
      cache: "no-store"
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      closure: null,
      message: extractMessage(data, "Impossible de charger la clôture.")
    };
  }

  return {
    ok: true,
    closure: data?.closure || null,
    message: ""
  };
};
