"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CancelSubscriptionButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function cancel() {
    if (!confirm("Точно отменить подписку? Доступ сохранится до конца оплаченного периода.")) return;
    setPending(true);
    await fetch("/api/billing/cancel", { method: "POST" });
    setPending(false);
    router.refresh();
  }

  return (
    <Button variant="outline" disabled={pending} onClick={cancel}>
      Отменить подписку
    </Button>
  );
}
