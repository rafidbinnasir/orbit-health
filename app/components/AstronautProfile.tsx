
"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase-browser";

export type AstronautProfileData = {
  full_name: string | null;
  astronaut_id: string | null;
  mission_name: string | null;
  rank?: string | null;
  age?: number | string | null;
  avatar_url: string | null;
};

export type AstronautProfileProps = {
  onRefresh?: () => void;
  avatarUrl?: string | null;
  rankFallback?: string;
  ageFallback?: string;
};

export default function AstronautProfile({
  onRefresh,
  avatarUrl = null,
  rankFallback = "Trainee Astronaut",
  ageFallback = "Not provided",
}: AstronautProfileProps) {
  const [profile, setProfile] = useState<AstronautProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarUrlState, setAvatarUrlState] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const supabase = createClient();

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          if (active) setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, astronaut_id, mission_name, avatar_url")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Could not load astronaut profile:", error);
          return;
        }

        if (!active || !data) return;

        const loadedProfile = data as AstronautProfileData;
        setProfile(loadedProfile);

        if (loadedProfile.avatar_url) {
          const { data: signedData, error: signedError } =
            await supabase.storage
              .from("astronaut-avatars")
              .createSignedUrl(loadedProfile.avatar_url, 3600);

          if (!signedError && signedData && active) {
            setAvatarUrlState(signedData.signedUrl);
          } else if (signedError) {
            console.error("Could not load astronaut photo:", signedError);
          }
        }
      } catch (error) {
        console.error("Profile loading failed:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  function handleRefresh() {
    setRefreshing(true);

    if (onRefresh) {
      try {
        onRefresh();
      } finally {
        setTimeout(() => setRefreshing(false), 600);
      }
    } else {
      window.location.reload();
    }
  }

  const astronautName = profile?.full_name?.trim() || "Astronaut";
  const astronautId = profile?.astronaut_id?.trim() || "ID PENDING";
  const rank = profile?.rank || rankFallback;
  const age = profile?.age != null ? String(profile.age) : ageFallback;
  const displayedAvatar = avatarUrlState || avatarUrl;

  return (
   <aside
  aria-label="Astronaut identity badge"
  className="relative flex min-h-44 w-full max-w-sm shrink-0 items-center gap-4 rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-cyan-500/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none dark:hover:border-slate-700"
>
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/15 via-slate-100 to-slate-200 text-cyan-600 dark:border-cyan-500/30 dark:from-cyan-950/50 dark:via-slate-800 dark:to-slate-900 dark:text-cyan-400 sm:h-20 sm:w-20">
        {displayedAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayedAvatar}
            alt={`${astronautName}'s profile`}
            className="h-full w-full object-cover"
          />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            <path d="M12 3a8 8 0 0 0-8 8v3a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-3a8 8 0 0 0-8-8z" />
            <path d="M8 11a4 4 0 0 1 8 0v1a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-1z" />
            <line x1="12" y1="3" x2="12" y2="1" />
            <path d="M7 21a5 5 0 0 1 10 0" />
          </svg>
        )}

        <span
          className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900"
          title="Crew telemetry active"
        />
      </div>

     <div className="min-w-0 flex-1">
  {/* Rank */}
  <div className="mb-1">
    <span className="inline-flex items-center rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300">
      {rank}
    </span>
  </div>

  {/* Astronaut Name */}
  <div className="min-w-0">
    {loading ? (
      <div className="h-5 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
    ) : (
      <p className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
        {astronautName}
      </p>
    )}
  </div>

  {/* Age */}
  <div className="mt-1 text-[15px] text-slate-500 dark:text-slate-400">
    Age:{" "}
    <span className="font-medium text-slate-700 dark:text-slate-300">
      {age}
    </span>
  </div>

  {/* Astronaut ID */}
  <div className="mt-1 flex min-w-0 items-center gap-1 text-[15px] text-slate-500 dark:text-slate-400">
    <span className="shrink-0 font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
      ID:
    </span>

    {loading ? (
      <span className="h-3 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
    ) : (
      <span className="truncate font-mono font-medium text-slate-700 dark:text-slate-300">
        {astronautId}
      </span>
    )}
  </div>
</div>

<img
  src="nasa.svg"
  alt="NASA logo"
  className="h-15 w-15 shrink-0 object-contain"
/>
    </aside>
  );
}
