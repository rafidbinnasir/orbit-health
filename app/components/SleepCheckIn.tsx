
"use client";

import { useEffect, useState } from "react";

export default function SleepCheckIn() {
  const [visible, setVisible] = useState(false);
  const [hours, setHours] = useState("7");
  const [minutes, setMinutes] = useState("0");
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSleepReport() {
      try {
        const response = await fetch("/api/sleep", {
          cache: "no-store",
        });

        if (response.status === 401) return;

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Could not check sleep status.");
        }

        if (active) {
          setVisible(result.shouldPrompt === true);
        }
      } catch (err) {
        console.error("Sleep check-in lookup failed:", err);
      } finally {
        if (active) setChecking(false);
      }
    }

    checkSleepReport();

    return () => {
      active = false;
    };
  }, []);

  async function submitSleepReport() {
    setError("");

    const sleepMinutes = Number(hours) * 60 + Number(minutes);

    if (!Number.isInteger(sleepMinutes) || sleepMinutes > 1440) {
      setError("Sleep duration cannot exceed 24 hours.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/sleep", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sleepMinutes }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setVisible(false);
          return;
        }

        throw new Error(result.error || "Could not save your sleep report.");
      }

      setVisible(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (checking || !visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="sleep-checkin-title"
        className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-[#071525] p-6 text-white shadow-2xl shadow-cyan-950/30"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-2xl">
            ☾
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-cyan-400">
              ORBIT HEALTH
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Daily astronaut check-in
            </p>
          </div>
        </div>

        <h2
          id="sleep-checkin-title"
          className="text-2xl font-semibold leading-tight"
        >
          How much have you slept in the last 24 hours?
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Enter your total sleep across the past 24 hours.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <label className="text-sm text-slate-300">
            Hours
            <select
              value={hours}
              onChange={(event) => setHours(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-cyan-400"
            >
              {Array.from({ length: 25 }, (_, index) => (
                <option key={index} value={index}>
                  {index} {index === 1 ? "hour" : "hours"}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-300">
            Minutes
            <select
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-cyan-400"
            >
              {[0, 15, 30, 45].map((value) => (
                <option key={value} value={value}>
                  {value} minutes
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-rose-400">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={submitSleepReport}
          disabled={saving}
          className="mt-6 w-full cursor-pointer rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving report..." : "Submit sleep report"}
        </button>

        <p className="mt-3 text-center text-xs text-slate-500">
          Your report is saved to your astronaut account.
        </p>
      </section>
    </div>
  );
}
