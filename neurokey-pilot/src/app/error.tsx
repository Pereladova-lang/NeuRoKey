"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/report-error";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(error.message, error.stack);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-lg">Что-то пошло не так. Мы уже знаем об этой ошибке.</p>
      <Button onClick={reset} className="h-11 min-w-44 text-lg">
        Попробовать снова
      </Button>
    </div>
  );
}
