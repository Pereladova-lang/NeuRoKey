"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type ChildProfile = { id: string; name: string; age: number };

export function ChildLoginForm({ profiles }: { profiles: ChildProfile[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<ChildProfile | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);

  if (!selected) {
    return (
      <div className="grid w-full max-w-md gap-4 sm:grid-cols-2">
        {profiles.map((child) => (
          <Card key={child.id}>
            <CardContent className="p-0">
              <button
                type="button"
                onClick={() => setSelected(child)}
                className="flex h-16 w-full items-center justify-center rounded-lg text-lg font-medium"
              >
                {child.name}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setPending(true);
    setError(false);
    const res = await fetch("/api/child-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ childId: selected.id, pin }),
    });
    setPending(false);
    if (res.ok) {
      router.push("/child/home");
      return;
    }
    setError(true);
    setPin("");
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-xs flex-col items-center gap-4">
      <p className="text-lg font-medium">Привет, {selected.name}! Введи PIN:</p>
      <Input
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        pattern="\d{4}"
        maxLength={4}
        className="h-14 text-center text-2xl tracking-[0.5em]"
        autoFocus
      />
      {error && <p className="text-lg text-destructive">Неверный PIN, попробуй ещё раз</p>}
      <div className="flex w-full gap-2">
        <Button type="button" variant="outline" className="h-12 flex-1 text-lg" onClick={() => setSelected(null)}>
          Назад
        </Button>
        <Button type="submit" disabled={pin.length !== 4 || pending} className="h-12 flex-1 text-lg">
          Войти
        </Button>
      </div>
    </form>
  );
}
