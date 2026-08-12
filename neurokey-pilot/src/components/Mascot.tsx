const LEVEL_TITLES: Record<number, string> = {
  1: "Новичок",
  2: "Следопыт",
  3: "Хранитель фокуса",
  4: "Стратег",
  5: "Мастер фокуса",
};

export function mascotTitle(level: number): string {
  return LEVEL_TITLES[Math.min(5, Math.max(1, level))];
}

export function Mascot({ level, line }: { level: number; line?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex size-24 items-center justify-center rounded-full bg-primary/10 text-5xl">🦊</div>
      <span className="text-lg font-medium text-muted-foreground">{mascotTitle(level)}</span>
      {line && (
        <div className="max-w-xs rounded-2xl bg-muted px-4 py-3 text-lg leading-snug text-foreground">{line}</div>
      )}
    </div>
  );
}
