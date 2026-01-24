"use client";

type Segment = {
  label: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  segments: Segment[];
  total: number;
};

const formatPercent = (value: number, total: number) => {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
};

export default function DonutChart({ segments, total }: DonutChartProps) {
  const gradient = segments.reduce((acc, segment, index) => {
    const start = acc.offset;
    const slice = total === 0 ? 0 : (segment.value / total) * 360;
    const end = start + slice;
    acc.stops.push(`${segment.color} ${start}deg ${end}deg`);
    acc.offset = end;
    return acc;
  }, { offset: 0, stops: [] as string[] });

  const background =
    total === 0
      ? "conic-gradient(rgba(255,255,255,0.08) 0deg 360deg)"
      : `conic-gradient(${gradient.stops.join(", ")})`;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div
        className="relative h-40 w-40 rounded-full"
        style={{ background }}
        aria-label="Estate breakdown chart"
      >
        <div className="absolute inset-4 rounded-full bg-zinc-950" />
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
          ${total.toFixed(0)}
        </div>
      </div>
      <div className="grid gap-2 text-sm text-white/70">
        {segments.map((segment) => (
          <div className="flex items-center gap-3" key={segment.label}>
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-white/80">{segment.label}</span>
            <span className="text-white/50">
              ${segment.value.toFixed(0)} · {formatPercent(segment.value, total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
