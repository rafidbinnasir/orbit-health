
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
    ReferenceLine,
} from "recharts";

type VitalReading = {
  id: number;
  heart_rate: number | null;
  spo2: number | null;
  temperature_c: number | null;
  recorded_at: string;
};
type SleepReport = {
  id: string;
  sleep_minutes: number;
  submitted_at: string;
};
type TimeRange = "1h" | "24h" | "7d" | "all";

const timeRanges: { label: string; value: TimeRange }[] = [
  { label: "1 hour", value: "1h" },
  { label: "24 hours", value: "24h" },
  { label: "7 days", value: "7d" },
  { label: "All time", value: "all" },
];

export default function VitalCharts({
  readings,
}: {
  readings: VitalReading[];
}) {
  const [isDark, setIsDark] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [sleepReports, setSleepReports] = useState<SleepReport[]>([]);
const [sleepError, setSleepError] = useState("");

useEffect(() => {
  let cancelled = false;

  async function loadSleepHistory() {
    try {
      const response = await fetch("/api/sleep");

      if (!response.ok) {
        throw new Error("Could not load sleep history.");
      }

      const result = await response.json();

      if (!cancelled) {
        setSleepReports(result.reports ?? []);
        setSleepError("");
      }
    } catch {
      if (!cancelled) {
        setSleepError("Sleep history is currently unavailable.");
      }
    }
  }

  loadSleepHistory();

  return () => {
    cancelled = true;
  };
}, []);

  useEffect(() => {
    function updateTheme() {
      setIsDark(document.documentElement.classList.contains("dark"));
    }

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const filteredReadings = useMemo(() => {
    const sorted = [...readings].sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() -
        new Date(b.recorded_at).getTime()
    );

    if (timeRange === "all") return sorted;

    const duration =
      timeRange === "1h"
        ? 60 * 60 * 1000
        : timeRange === "24h"
          ? 24 * 60 * 60 * 1000
          : 7 * 24 * 60 * 60 * 1000;

    const cutoff = Date.now() - duration;

    return sorted.filter(
      (reading) =>
        new Date(reading.recorded_at).getTime() >= cutoff
    );
  }, [readings, timeRange]);

  const chartData = filteredReadings.map((reading) => ({
    time: new Date(reading.recorded_at).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    heartRate: reading.heart_rate,
    spo2: reading.spo2,
    temperature: reading.temperature_c,
  }));
  const sleepChartData = [...sleepReports]
  .sort(
    (a, b) =>
      new Date(a.submitted_at).getTime() -
      new Date(b.submitted_at).getTime()
  )
  .map((report) => ({
    time: new Date(report.submitted_at).toLocaleDateString([], {
      month: "short",
      day: "numeric",
    }),
    hours: Number((report.sleep_minutes / 60).toFixed(2)),
  }));

  const gridStroke = isDark ? "#334155" : "#e2e8f0";
  const axisStroke = isDark ? "#94a3b8" : "#64748b";

  const tooltipContentStyle = {
    backgroundColor: isDark ? "#0f172a" : "#ffffff",
    borderColor: isDark ? "#334155" : "#e2e8f0",
    color: isDark ? "#f8fafc" : "#0f172a",
    borderRadius: "0.75rem",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
  };

  const tooltipItemStyle = {
    color: isDark ? "#f8fafc" : "#0f172a",
  };

  const axisProps = {
    stroke: axisStroke,
    tick: { fill: axisStroke, fontSize: 12 },
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Historical Trends
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filteredReadings.length} readings in selected period
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              type="button"
              onClick={() => setTimeRange(range.value)}
              aria-pressed={timeRange === range.value}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                timeRange === range.value
                  ? "bg-cyan-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </section>

      {chartData.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/80">
          <p className="font-medium text-slate-700 dark:text-slate-200">
            No readings in this period
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Select another time range or add a new reading.
          </p>
        </section>
      ) : (
        <>
          <ChartPanel title="Heart Rate" unit="BPM">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="time" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip
                contentStyle={tooltipContentStyle}
                itemStyle={tooltipItemStyle}
              />
              <Legend
                wrapperStyle={{
                  color: isDark ? "#cbd5e1" : "#475569",
                }}
              />
              <Line
                type="monotone"
                dataKey="heartRate"
                name="Heart rate"
                stroke="#fb7185"
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ChartPanel>

          <ChartPanel title="Blood Oxygen (SpO₂)" unit="%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="time" {...axisProps} />
              <YAxis domain={[0, 100]} {...axisProps} />
              <Tooltip
                contentStyle={tooltipContentStyle}
                itemStyle={tooltipItemStyle}
              />
              <Legend
                wrapperStyle={{
                  color: isDark ? "#cbd5e1" : "#475569",
                }}
              />
              <Line
                type="monotone"
                dataKey="spo2"
                name="SpO₂"
                stroke="#22d3ee"
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ChartPanel>

          <ChartPanel title="Body Temperature" unit="°C">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="time" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip
                contentStyle={tooltipContentStyle}
                itemStyle={tooltipItemStyle}
              />
              <Legend
                wrapperStyle={{
                  color: isDark ? "#cbd5e1" : "#475569",
                }}
              />
              <Line
                type="monotone"
                dataKey="temperature"
                name="Temperature"
                stroke="#fbbf24"
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ChartPanel>
          
<ChartPanel title="Sleep Duration" unit="hours">
  {sleepError ? (
    <div className="flex h-full items-center justify-center text-sm text-rose-500">
      {sleepError}
    </div>
  ) : sleepChartData.length === 0 ? (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <p className="font-medium text-slate-700 dark:text-slate-200">
        No sleep reports yet
      </p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Submit a sleep check-in to start tracking your history.
      </p>
    </div>
  ) : (
    <LineChart data={sleepChartData}>
      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
      <XAxis dataKey="time" {...axisProps} />
      <YAxis
        domain={[0, 12]}
        tickFormatter={(value) => `${value}h`}
        {...axisProps}
      />
      <Tooltip
        contentStyle={tooltipContentStyle}
        itemStyle={tooltipItemStyle}
        formatter={(value) => [`${value} hours`, "Sleep"]}
      />
      <Legend
        wrapperStyle={{
          color: isDark ? "#cbd5e1" : "#475569",
        }}
      />
      <ReferenceLine
        y={8}
        stroke="#22c55e"
        strokeDasharray="5 5"
        label={{ value: "8h target", fill: axisStroke, fontSize: 12 }}
      />
      <Line
        type="monotone"
        dataKey="hours"
        name="Sleep duration"
        stroke="#a78bfa"
        strokeWidth={2}
        activeDot={{ r: 5 }}
        isAnimationActive={false}
      />
    </LineChart>
  )}
</ChartPanel>


        </>
      )}
      
    </div>
  );
}

function ChartPanel({
  title,
  unit,
  children,
}: {
  title: string;
  unit: string;
  children: React.ReactElement;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
      <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
        Historical readings ({unit})
      </p>
      <ResponsiveContainer width="100%" height={260}>
        {children}
      </ResponsiveContainer>
    </section>
  );
}
