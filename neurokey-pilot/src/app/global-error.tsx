"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/report-error";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(error.message, error.stack);
  }, [error]);

  return (
    <html lang="ru">
      <body style={{ display: "flex", minHeight: "100%", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", padding: "1.5rem", textAlign: "center", fontFamily: "sans-serif" }}>
        <p style={{ fontSize: "18px" }}>Что-то пошло не так. Мы уже знаем об этой ошибке.</p>
        <button
          onClick={reset}
          style={{ height: "44px", minWidth: "180px", fontSize: "18px", borderRadius: "8px", border: "1px solid #6366F1", background: "#6366F1", color: "white" }}
        >
          Попробовать снова
        </button>
      </body>
    </html>
  );
}
