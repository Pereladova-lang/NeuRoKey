"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/report-error";

/**
 * Catches errors outside React's render tree (event handlers, timers,
 * unhandled promise rejections) — error.tsx/global-error.tsx only cover
 * render-time crashes.
 */
export function ClientErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => reportClientError(e.message, e.error?.stack);
    const onRejection = (e: PromiseRejectionEvent) =>
      reportClientError(e.reason instanceof Error ? e.reason.message : String(e.reason), e.reason instanceof Error ? e.reason.stack : undefined);

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
