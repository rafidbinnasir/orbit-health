
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase-browser";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handlePasswordUpdate(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
      setMessage("Your password has been updated successfully.");

      setPassword("");
      setConfirmPassword("");

      await supabase.auth.signOut();

      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 2000);
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Unable to update your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-5 py-12 text-white">
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

      <div className="pointer-events-none absolute inset-0 z-10 bg-slate-950/50" />

      <section className="relative z-20 w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/90 p-8 shadow-xl backdrop-blur-xl">
        <p className="mb-2 text-sm font-semibold tracking-widest text-cyan-400">
          ORBIT HEALTH
        </p>

        <h1 className="mb-2 text-3xl font-bold">
          Reset your password
        </h1>

        <p className="mb-8 text-sm text-slate-400">
          Choose a new password for your astronaut account.
        </p>

        <form onSubmit={handlePasswordUpdate} className="space-y-5">
          <div>
            <label htmlFor="password" className="mb-2 block text-sm">
              New password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm">
              Confirm new password
            </label>

            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="Enter your new password again"
            />
          </div>

          {message && (
            <p
              role={success ? "status" : "alert"}
              aria-live="polite"
              className={`rounded-lg border p-3 text-sm ${
                success
                  ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
                  : "border-red-400/20 bg-red-400/10 text-red-300"
              }`}
            >
              {message}
            </p>
          )}

          {!success && (
            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Updating password..." : "Update password"}
            </button>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link
            href="/login"
            className="font-semibold text-cyan-400 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
