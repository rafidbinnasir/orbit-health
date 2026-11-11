"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase-browser";
import { useEffect, useRef, useState } from "react";
import VitalCharts from "./components/vitalCharts";
import TypingHeading from "./components/TypingHeading";
import Link from "next/link";
import ThemeToggle from "./components/ThemeToggle";
import HealthAssistant from "./components/HealthAssistant";
import HealthInsights from "./components/HealthInsights";
import CompactVitals from "./components/CompactVitals";
import AstronautProfile from "./components/AstronautProfile";
import AnatomicalMonitor from "./components/AnatomicalMonitor";
import SleepCheckIn from "./components/SleepCheckIn";
import MLAnomalyAlerts from "./components/MLAnomalyAlerts";

type VitalReading = {
  id: number;
  heart_rate: number | null;
  spo2: number | null;
  temperature_c: number | null;
  recorded_at: string;
};

export default function Home() {
  const router = useRouter();
  const ambienceRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = ambienceRef.current;
    if (!audio) return;

    let isMounted = true;
    audio.volume = 0.05; // 5% volume
    audio.loop = true; // Nonstop continuous loop

    const removeListeners = () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleInteraction);
      });
    };

    const handleInteraction = () => {
      if (!isMounted) return;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            removeListeners();
          })
          .catch(() => {
            // Still waiting for eligible interaction
          });
      }
    };

    const events: Array<keyof WindowEventMap> = [
      "click",
      "pointerdown",
      "keydown",
      "touchstart",
    ];

    // Attempt immediate automatic playback
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Autoplay permitted immediately
        })
        .catch(() => {
          // If browser policy restricts unmuted autoplay until user gesture,
          // automatically start on the very first user interaction anywhere
          events.forEach((event) => {
            window.addEventListener(event, handleInteraction, {
              passive: true,
            });
          });
        });
    }

    return () => {
      isMounted = false;
      removeListeners();
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authChecking, setAuthChecking] = useState(true);
useEffect(() => {
  let isActive = true;

  async function checkUserRole() {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!isActive) return;

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!isActive) return;

    if (roleError || !roleData) {
      router.replace("/login");
      return;
    }

    if (roleData.role === "admin") {
      router.replace("/admin");
      return;
    }

    setAuthChecking(false);
  }

  checkUserRole();

  return () => {
    isActive = false;
  };
}, [router]);
  async function handleSignOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out failed:", error.message);
      setError("Unable to sign out. Please try again.");
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  useEffect(() => {
    let isActive = true;

    async function fetchReadings() {
      try {
        const response = await fetch("/api/vitals", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load vital readings.");
        }

        const data = await response.json();

        if (isActive) {
          setReadings(data.readings ?? []);
          setError("");
        }
      } catch {
        if (isActive) {
          setError("Unable to load readings. Please try again.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchReadings();

    const intervalId = window.setInterval(() => {
      fetchReadings();
    }, 5000);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, []);

  if (authChecking) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-cyan-400">
      Verifying your mission access...
    </main>
  );
}

  return (
     <>
    <SleepCheckIn />
    <main className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-white">
      <audio
        ref={ambienceRef}
        src="/space-ambience.mp3"
        loop
        preload="auto"
        aria-hidden="true"
      />
      {/* TOP NAVIGATION */}
      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          {/* BRAND */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3 rounded-xl"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="2" />
                <ellipse
                  cx="12"
                  cy="12"
                  rx="10"
                  ry="4.5"
                  transform="rotate(-30 12 12)"
                />
                <circle cx="19.5" cy="7.5" r="1" />
              </svg>
            </div>

            <div>
              <p className="font-bold tracking-wide text-slate-900 dark:text-white">
                ORBIT Health
              </p>
              <p className="text-xs tracking-widest text-cyan-600 dark:text-cyan-400">
                MISSION CONTROL
              </p>
            </div>
          </Link>

          {/* NAVIGATION LINKS */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <a
              href="#dashboard"
              className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-700 transition hover:bg-cyan-500/15 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300 dark:hover:bg-cyan-400/15 sm:px-4"
            >
              Dashboard
            </a>

            <a
              href="#anatomy"
              className="rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white sm:px-4"
            >
              3D Anatomy
            </a>

            <a
              href="#insights"
              className="rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white sm:px-4"
            >
              Insights
            </a>

            <a
              href="#readings"
              className="rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white sm:px-4"
            >
              Records
            </a>

            <a
              href="#charts"
              className="rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white sm:px-4"
            >
              Analytics
            </a>

            <Link
              href="/profile"
              className="rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white sm:px-4"
            >
              Profile
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-rose-400/40 dark:hover:bg-rose-400/10 dark:hover:text-rose-300 sm:px-4"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN DASHBOARD */}
      <div
        id="dashboard"
        className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10"
      >
        
        {/* DASHBOARD HEADER */}
        <header className="mb-10 flex flex-wrap items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-[0.3em] text-cyan-600 dark:text-cyan-400">
              ORBIT HEALTH
            </p>

            <TypingHeading />

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Monitor and review your recorded vital signs.
            </p>
          </div>

          <AstronautProfile />
        </header>

        {/* ERROR MESSAGE */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300"
          >
            {error}
          </div>
        )}
        {/* MISSION TELEMETRY: HEALTH INSIGHTS + COMPACT VITALS */}
        <div className="mb-10 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
         
          <div className="min-w-0 lg:col-span-2">
            <HealthInsights />
          </div>
           {/* MACHINE LEARNING ANOMALY DETECTION */}
<MLAnomalyAlerts />

          <div className="min-w-0 lg:col-span-1">
            <CompactVitals readings={readings} loading={loading} />
          </div>
        </div>

        {/* 3D ANATOMICAL TELEMETRY MONITOR */}
        <section id="anatomy" className="mb-10 scroll-mt-24">
          <AnatomicalMonitor readings={readings} loading={loading} />
        </section>

        {loading ? (
          <div
            className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:shadow-none"
            role="status"
          >
            Loading your readings...
          </div>
        ) : (
          <>

            {/* RECENT READINGS */}
            <section
              id="readings"
              className="mt-10 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                    Records
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                    Recent Readings
                  </h2>
                </div>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-400">
                  {readings.length} records
                </span>
              </div>

              {readings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center dark:border-slate-700">
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    No readings yet
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Your recorded vital signs will appear here when available.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-sm text-slate-700 dark:text-slate-200">
                    <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      <tr>
                        <th className="py-3 pr-4 font-medium">
                          Recorded at
                        </th>
                        <th className="px-4 py-3 font-medium">
                          Heart rate
                        </th>
                        <th className="px-4 py-3 font-medium">
                          SpO₂
                        </th>
                        <th className="px-4 py-3 font-medium">
                          Temperature
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {readings.map((reading) => (
                        <tr
                          key={reading.id}
                          className="border-b border-slate-200/80 transition last:border-0 hover:bg-slate-50 dark:border-slate-800/80 dark:hover:bg-slate-800/30"
                        >
                          <td className="py-4 pr-4 text-slate-600 dark:text-slate-300">
                            {new Date(
                              reading.recorded_at
                            ).toLocaleString()}
                          </td>

                          <td className="px-4 py-4">
                            {reading.heart_rate ?? "—"} BPM
                          </td>

                          <td className="px-4 py-4">
                            {reading.spo2 ?? "—"}%
                          </td>

                          <td className="px-4 py-4">
                            {reading.temperature_c ?? "—"} °C
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* VITAL CHARTS */}
            <section
              id="charts"
              className="mt-10 scroll-mt-24"
            >
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                  Data Analytics
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  Vital Signs Over Time
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Explore your recorded vital-sign history.
                </p>
              </div>

              <VitalCharts readings={readings} />
            </section>

            {/* FOOTER */}
            <footer className="mt-10 border-t border-slate-200 pt-5 dark:border-slate-800">
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                ORBIT Health · Astronaut health-monitoring project.
                Displayed readings are not a substitute for professional
                medical assessment.
              </p>
            </footer>
          </>
        )}
      </div>

      {/* FLOATING HEALTH ASSISTANT */}
      <HealthAssistant />
    </main>
    </>
  );
}
