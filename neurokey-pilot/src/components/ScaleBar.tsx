const SCALE_LABELS: Record<string, string> = {
  attention: "Внимание",
  memory: "Память",
  logic: "Логика",
  control: "Контроль",
};

export function ScaleBar({
  scale,
  value,
  delta,
}: {
  scale: "attention" | "memory" | "logic" | "control";
  value: number;
  delta: number;
}) {
  const deltaLabel =
    delta === 0 ? null : delta > 0 ? `↑${delta}%` : `↓${Math.abs(delta)}%`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{SCALE_LABELS[scale]}</span>
        <span className="flex items-center gap-2 text-muted-foreground">
          <span>{value}%</span>
          {deltaLabel && (
            <span className={delta > 0 ? "text-emerald-600" : "text-muted-foreground"}>{deltaLabel}</span>
          )}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}
