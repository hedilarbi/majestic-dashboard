"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const UserContext = createContext({
  user: null,
  isLoading: true,
  refreshUser: async () => {},
});

export const USER_CACHE_KEY = "majestic_user_cache_v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

const readCachedUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(USER_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const cached = JSON.parse(raw);
    if (!cached?.user || !cached?.timestamp) {
      return null;
    }

    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(USER_CACHE_KEY);
      return null;
    }

    return cached.user;
  } catch {
    return null;
  }
};

const writeCachedUser = (user) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (!user) {
      sessionStorage.removeItem(USER_CACHE_KEY);
      return;
    }

    sessionStorage.setItem(
      USER_CACHE_KEY,
      JSON.stringify({ user, timestamp: Date.now() })
    );
  } catch {}
};

export const clearUserCache = () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.removeItem(USER_CACHE_KEY);
  } catch {}
};

export function UserProvider({ initialUser = null, children }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);

  const fetchUser = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        clearUserCache();
        setUser(null);

        if (response.status === 401 || response.status === 403) {
          router.replace("/connexion");
        }

        return;
      }

      const nextUser = data?.user ?? null;
      setUser(nextUser);
      writeCachedUser(nextUser);
    } catch {
      clearUserCache();
      setUser(null);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [router]);

  const refreshUser = useCallback(
    async ({ force = false } = {}) => {
      if (!force) {
        const cachedUser = readCachedUser();
        if (cachedUser) {
          setUser(cachedUser);
          setIsLoading(false);
          fetchUser({ silent: true });
          return;
        }
      }

      await fetchUser();
    },
    [fetchUser]
  );

  useEffect(() => {
    if (!initialUser) {
      refreshUser();
      return;
    }

    writeCachedUser(initialUser);
    setIsLoading(false);
    fetchUser({ silent: true });
  }, [initialUser, refreshUser, fetchUser]);

  useEffect(() => {
    const handleFocus = () => {
      const cachedUser = readCachedUser();
      if (!cachedUser) {
        refreshUser({ force: true });
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshUser]);

  const value = useMemo(
    () => ({ user, isLoading, refreshUser }),
    [user, isLoading, refreshUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
