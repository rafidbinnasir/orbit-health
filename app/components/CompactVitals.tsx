"use client";

type VitalReading = {
  id: number;
  heart_rate: number | null;
  spo2: number | null;
  temperature_c: number | null;
  recorded_at: string;
};

type CompactVitalsProps = {
  readings: VitalReading[];
  loading?: boolean;
};

type TrendState = {
  direction: "up" | "down" | "neutral" | "insufficient";
  deltaText: string;
  srText: string;
};

function computeTrend(
  current: number | null | undefined,
  previous: number | null | undefined,
  unit: string
): TrendState {
  if (
    current === null ||
    current === undefined ||
    previous === null ||
    previous === undefined
  ) {
    return {
      direction: "insufficient",
      deltaText: "—",
      srText: "Insufficient historical data for trend comparison",
    };
  }

  const diff = Number((current - previous).toFixed(1));

  if (diff > 0) {
    return {
      direction: "up",
      deltaText: `+${diff}`,
      srText: `Increased by ${diff} ${unit} from previous measurement (${previous} ${unit})`,
    };
  }

  if (diff < 0) {
    return {
      direction: "down",
      deltaText: `${diff}`,
      srText: `Decreased by ${Math.abs(diff)} ${unit} from previous measurement (${previous} ${unit})`,
    };
  }

  return {
    direction: "neutral",
    deltaText: "0",
    srText: `Unchanged from previous measurement (${previous} ${unit})`,
  };
}

export default function CompactVitals({
  readings,
  loading = false,
}: CompactVitalsProps) {
  const current = readings[0];
  const previous = readings.length > 1 ? readings[1] : null;

  const hrTrend = computeTrend(
    current?.heart_rate,
    previous?.heart_rate,
    "BPM"
  );
  const spo2Trend = computeTrend(current?.spo2, previous?.spo2, "%");
  const tempTrend = computeTrend(
    current?.temperature_c,
    previous?.temperature_c,
    "°C"
  );

  if (loading) {
    return (
      <section
        aria-label="Vitals telemetry loading"
        className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900/90"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800/60">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="mt-3 space-y-2.5">
          <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/50" />
          <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/50" />
          <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/50" />
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="vitals-panel-heading"
      className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm transition-colors duration-200 sm:p-5 dark:border-slate-800 dark:bg-slate-900/90"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
          </span>
          <h3
            id="vitals-panel-heading"
            className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200"
          >
            Telemetry Vitals
          </h3>
        </div>

        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
          {current?.recorded_at
            ? new Date(current.recorded_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "No telemetry"}
        </span>
      </div>

      {/* THREE COMPACT MEASUREMENT CARDS */}
      <div className="mt-3 space-y-2.5">
        {/* 1. HEART RATE */}
        <VitalCardItem
          label="Heart Rate"
          value={current?.heart_rate ?? "—"}
          unit="BPM"
          trend={hrTrend}
        />

        {/* 2. BLOOD OXYGEN */}
        <VitalCardItem
          label="Blood Oxygen"
          value={
            current?.spo2 !== null && current?.spo2 !== undefined
              ? current.spo2
              : "—"
          }
          unit="%"
          trend={spo2Trend}
        />

        {/* 3. TEMPERATURE */}
        <VitalCardItem
          label="Temperature"
          value={
            current?.temperature_c !== null &&
            current?.temperature_c !== undefined
              ? `${current.temperature_c}`
              : "—"
          }
          unit="°C"
          trend={tempTrend}
        />
      </div>

      {/* FOOTER METADATA */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400 dark:border-slate-800/60 dark:text-slate-500">
        <span>Trend: vs. previous reading</span>
        <span>{readings.length} total logged</span>
      </div>
    </section>
  );
}

function VitalCardItem({
  label,
  value,
  unit,
  trend,
}: {
  label: string;
  value: number | string;
  unit: string;
  trend: TrendState;
}) {
  return (
    <div className="relative flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/70 px-3.5 py-2.5 transition hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-950/60 dark:hover:border-slate-700">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <div className="mt-0.5 flex items-baseline gap-1">
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {value}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        </div>
      </div>

      <div className="flex items-center">
        <TrendIndicator trend={trend} />
      </div>
    </div>
  );
}

function TrendIndicator({ trend }: { trend: TrendState }) {
  if (trend.direction === "up") {
    return (
      <span
        title={trend.srText}
        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300"
      >
        <span aria-hidden="true" className="text-xs">
          ↑
        </span>
        <span className="text-[10px] font-semibold">{trend.deltaText}</span>
        <span className="sr-only">{trend.srText}</span>
      </span>
    );
  }

  if (trend.direction === "down") {
    return (
      <span
        title={trend.srText}
        className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/60 dark:text-rose-300"
      >
        <span aria-hidden="true" className="text-xs">
          ↓
        </span>
        <span className="text-[10px] font-semibold">{trend.deltaText}</span>
        <span className="sr-only">{trend.srText}</span>
      </span>
    );
  }

  if (trend.direction === "neutral") {
    return (
      <span
        title={trend.srText}
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      >
        <span aria-hidden="true" className="text-xs">
          —
        </span>
        <span className="text-[10px] font-semibold">0</span>
        <span className="sr-only">{trend.srText}</span>
      </span>
    );
  }

  // Insufficient historical data fallback
  return (
    <span
      title={trend.srText}
      className="inline-flex items-center rounded-md border border-slate-200/60 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-500"
    >
      <span aria-hidden="true">—</span>
      <span className="sr-only">{trend.srText}</span>
    </span>
  );
}
