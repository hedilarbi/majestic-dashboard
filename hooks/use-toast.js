"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const useToast = (duration = 3000) => {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const clearToast = useCallback(() => {
    setToast(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showToast = useCallback(
    (messageOrToast, type = "success") => {
      const nextToast =
        messageOrToast &&
        typeof messageOrToast === "object" &&
        !Array.isArray(messageOrToast)
          ? {
              message:
                typeof messageOrToast.message === "string"
                  ? messageOrToast.message
                  : "",
              type:
                messageOrToast.type === "error" ? "error" : "success",
            }
          : {
              message:
                typeof messageOrToast === "string" ? messageOrToast : "",
              type: type === "error" ? "error" : "success",
            };

      setToast(nextToast);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        setToast(null);
      }, duration);
    },
    [duration]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { toast, showToast, clearToast };
};
