"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

import { useDashboardModulePermissions } from "@/hooks/use-dashboard-permissions";
import { resolveSocketUrl } from "@/lib/guichet/api-client";

import { Icon } from "@/components/ui/icons";

const formatDateTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatEstablishmentType = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "association") {
    return "Association";
  }

  if (normalized === "organisation") {
    return "Organisation";
  }

  return normalized || "";
};

export default function NotificationsBell() {
  const router = useRouter();
  const permissions = useDashboardModulePermissions("reservation_requests");
  const canListReservationRequests = permissions.canList;
  const containerRef = useRef(null);
  const isDropdownOpenRef = useRef(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    isDropdownOpenRef.current = isDropdownOpen;
  }, [isDropdownOpen]);

  const unreadCount = unreadNotifications.length;

  const refreshUnreadNotifications = useCallback(
    async ({ allowWhileOpen = false } = {}) => {
      if (
        !canListReservationRequests ||
        (isDropdownOpenRef.current && !allowWhileOpen)
      ) {
        return [];
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/dashboard-notifications", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setUnreadNotifications([]);
          return [];
        }

        const items = Array.isArray(data?.items) ? data.items : [];
        setUnreadNotifications(items);
        return items;
      } catch {
        setUnreadNotifications([]);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [canListReservationRequests],
  );

  useEffect(() => {
    if (!canListReservationRequests) {
      return undefined;
    }

    void refreshUnreadNotifications();

    const interval = window.setInterval(() => {
      void refreshUnreadNotifications();
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [canListReservationRequests, refreshUnreadNotifications]);

  useEffect(() => {
    if (!canListReservationRequests) {
      return undefined;
    }

    const socketUrl = resolveSocketUrl();
    if (!socketUrl) {
      return undefined;
    }

    const socket = io(socketUrl, {
      transports: ["polling", "websocket"],
      reconnection: true,
      timeout: 10000,
    });

    const handleNotificationCreated = () => {
      if (isDropdownOpenRef.current) {
        return;
      }

      void refreshUnreadNotifications();
    };

    socket.on("dashboard-notification-created", handleNotificationCreated);

    return () => {
      socket.off("dashboard-notification-created", handleNotificationCreated);
      socket.disconnect();
    };
  }, [canListReservationRequests, refreshUnreadNotifications]);

  useEffect(() => {
    if (!isDropdownOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsDropdownOpen(false);
        setVisibleNotifications([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const markNotificationsRead = useCallback(async (notificationIds = []) => {
    if (!notificationIds.length) {
      return;
    }

    try {
      await fetch("/api/dashboard-notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds }),
      });
    } catch {
      return;
    }
  }, []);

  const handleToggleDropdown = async () => {
    if (!canListReservationRequests) {
      return;
    }

    if (isDropdownOpen) {
      setIsDropdownOpen(false);
      setVisibleNotifications([]);
      return;
    }

    let snapshot = Array.isArray(unreadNotifications)
      ? unreadNotifications
      : [];

    if (snapshot.length === 0 && !isLoading) {
      snapshot = await refreshUnreadNotifications({ allowWhileOpen: true });
    }

    setVisibleNotifications(snapshot);
    setUnreadNotifications([]);
    setIsDropdownOpen(true);

    if (snapshot.length > 0) {
      void markNotificationsRead(
        snapshot.map((item) => item.id).filter(Boolean),
      );
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification?.link) {
      return;
    }

    setIsDropdownOpen(false);
    setVisibleNotifications([]);
    router.push(notification.link);
  };

  const dropdownItems = useMemo(
    () => (isDropdownOpen ? visibleNotifications : []),
    [isDropdownOpen, visibleNotifications],
  );

  if (!canListReservationRequests) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative z-50">
      <button
        type="button"
        onClick={handleToggleDropdown}
        className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100"
        aria-label="Ouvrir les notifications"
        aria-expanded={isDropdownOpen}
      >
        <Icon name="bell" className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isDropdownOpen ? (
        <div className="absolute right-0 top-full z-[60] mt-3 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Notifications
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Demandes de réservation récentes
                </p>
              </div>
              {isLoading ? (
                <span className="text-xs text-slate-400">Mise à jour...</span>
              ) : null}
            </div>
          </div>

          {dropdownItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              Aucune nouvelle notification.
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              {dropdownItems.map((notification) => {
                const requesterName =
                  notification?.metadata?.fullName ||
                  [
                    notification?.metadata?.firstName,
                    notification?.metadata?.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ");
                const reservationDateLabel = formatDateTime(
                  notification?.metadata?.reservationDateTime,
                );
                const establishmentType = formatEstablishmentType(
                  notification?.metadata?.establishmentType,
                );

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="flex w-full flex-col gap-2 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {notification.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {formatDateTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
                      {notification.message}
                    </p>
                    <div className="space-y-1 text-xs text-slate-500">
                      {requesterName ? <p>{requesterName}</p> : null}
                      {notification?.metadata?.email ? (
                        <p>{notification.metadata.email}</p>
                      ) : null}
                      {establishmentType ? <p>{establishmentType}</p> : null}
                      {reservationDateLabel ? (
                        <p>Souhaitée le {reservationDateLabel}</p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
