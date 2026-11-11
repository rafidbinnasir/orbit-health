
"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase-browser";

type MLPrediction = {
  id: number;
  reading_id: number;
  status: string;
  prediction: number;
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
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("ml_predictions")
          .select(
            "id, reading_id, status, prediction, anomaly_score, created_at"
          )
          .eq("status", "ANOMALY")
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        if (isActive) {
          setPredictions(data ?? []);
          setError("");
        }
      } catch (err) {
        console.error("Failed to load ML predictions:", err);

        if (isActive) {
          setError("Unable to load ML anomaly detections.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchPredictions();

    const intervalId = window.setInterval(fetchPredictions, 5000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <section className="mb-10 rounded-2xl border border-amber-300/60 bg-white p-5 shadow-sm sm:p-7 dark:border-amber-500/20 dark:bg-slate-900/80 dark:shadow-none">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Machine Learning
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
            ML Anomaly Detection
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Unusual vital-sign patterns detected by Isolation Forest.
          </p>
        </div>

        <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {predictions.length} anomalies
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading ML detections...
        </p>
      ) : error ? (
        <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : predictions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-5 py-8 text-center dark:border-slate-700">
          <p className="font-medium text-slate-700 dark:text-slate-300">
            No anomalies detected
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            No unusual patterns have been recorded by the ML model.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {predictions.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-500/20 dark:bg-amber-500/5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-amber-800 dark:text-amber-300">
                  Unusual pattern detected
                </span>
                <span className="rounded-full bg-amber-200/70 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-500/20 dark:text-amber-300">
                  ANOMALY
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                <p className="text-slate-600 dark:text-slate-300">
                  Reading ID:{" "}
                  <span className="font-medium text-slate-900 dark:text-white">
                    {item.reading_id}
                  </span>
                </p>

                <p className="text-slate-600 dark:text-slate-300">
                  Anomaly score:{" "}
                  <span className="font-medium text-slate-900 dark:text-white">
                    {item.anomaly_score.toFixed(5)}
                  </span>
                </p>

                <p className="text-slate-600 dark:text-slate-300">
                  Detected:{" "}
                  <span className="font-medium text-slate-900 dark:text-white">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        ML anomaly detections indicate unusual data patterns, not a medical
        diagnosis. Review readings with a qualified healthcare professional.
      </p>
    </section>
  );
}
