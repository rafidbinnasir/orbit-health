
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  throw error;
}

const { data: roleData, error: roleError } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", data.user.id)
  .single();

if (roleError || !roleData) {
  await supabase.auth.signOut();
  throw new Error("Unable to verify your account permissions.");
}

router.push(roleData.role === "admin" ? "/admin" : "/");
router.refresh();
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Oops! Let's try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
   <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-5 py-12 text-white">
  {/* Background video */}
  <video
    autoPlay
    muted
    loop
    playsInline
    preload="auto"
    aria-hidden="true"
    className="absolute inset-0 z-0 h-full w-full object-cover"
  >
    <source src="/4-135665514.mp4" type="video/mp4" />
  </video>

  {/* Dark overlay */}
  <div className="pointer-events-none absolute inset-0 z-10 bg-slate-950/40" />

  {/* Existing login card */}
  <section className="relative z-20 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <p className="mb-2 text-sm font-semibold tracking-widest text-cyan-400">
          ORBIT HEALTH
        </p>

        <h1 className="mb-2 text-3xl font-bold">
          Welcome Captain!
        </h1>

        <p className="mb-8 text-sm text-slate-400">
          Sign in to access your health dashboard.
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="Your password"
            />
          </div>
<div className="flex justify-end">
  <Link
    href="/forgot-password"
    className="text-sm font-medium text-cyan-400 hover:text-cyan-300 hover:underline"
  >
    Forgot password?
  </Link>
</div>
          {message && (
            <p role="alert" className="text-sm text-red-400">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          New Here?{" "}
          <Link
            href="/signup"
            className="font-semibold text-cyan-400 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
