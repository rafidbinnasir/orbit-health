
"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase-browser";

type MLPrediction = {
  id: number;
  reading_id: number;
  status: string;
  anomaly_score: number;
  created_at: string;
};

export default function MLAnomalyAlerts() {
  const [predictions, setPredictions] = useState<MLPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function fetchPredictions() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("ml_predictions")
        .select("id, reading_id, status, anomaly_score, created_at")
        .eq("status", "ANOMALY")
        .order("created_at", { ascending: false })
        .limit(3);

      if (!isActive) return;

      if (error) {
        setError("Unable to load detections.");
      } else {
        setPredictions(data ?? []);
        setError("");
      }

      setLoading(false);
    }

    fetchPredictions();

    const intervalId = window.setInterval(fetchPredictions, 5000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <section className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
      <div className="mb-5 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Machine Learning
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
            Anomaly Detection
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Isolation Forest analysis
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading detections...
        </p>
      ) : error ? (
        <p role="alert" className="text-sm text-rose-500">
          {error}
        </p>
      ) : predictions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center dark:border-slate-700">
          <span className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            No anomalies detected
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            No unusual patterns recorded recently.
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Recent detections
            </span>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              {predictions.length} shown
            </span>
          </div>

          {predictions.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  Reading #{item.reading_id}
                </span>
                <span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold tracking-wide text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  ANOMALY
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Anomaly score
                </span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                  {item.anomaly_score.toFixed(5)}
                </span>
              </div>

              <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                {new Date(item.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <p className="mt-auto pt-4 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
        ML detections identify unusual patterns and are not medical diagnoses.
      </p>
    </section>
  );
}
