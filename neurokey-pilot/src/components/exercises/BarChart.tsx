export function BarChart({
  labels,
  values,
  yLabel,
}: {
  labels: string[];
  values: number[];
  yLabel: string;
}) {
  const width = 320;
  const height = 180;
  const padding = 32;
  const max = Math.max(...values, 1);
  const barWidth = (width - padding * 2) / values.length;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={yLabel}
      className="h-auto w-full max-w-sm"
    >
      <line x1={padding} y1={height - padding} x2={width - 8} y2={height - padding} stroke="currentColor" strokeOpacity={0.2} />
      {values.map((value, i) => {
        const barHeight = (value / max) * (height - padding * 2);
        const x = padding + i * barWidth + barWidth * 0.15;
        const y = height - padding - barHeight;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth * 0.7} height={barHeight} fill="#6366F1" rx={4} />
            <text
              x={x + (barWidth * 0.7) / 2}
              y={height - padding + 16}
              textAnchor="middle"
              fontSize={12}
              fill="currentColor"
            >
              {labels[i]}
            </text>
            <text x={x + (barWidth * 0.7) / 2} y={y - 4} textAnchor="middle" fontSize={12} fill="currentColor">
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
