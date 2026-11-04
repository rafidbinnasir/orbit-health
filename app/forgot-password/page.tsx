
"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase-browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResetRequest(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");
    setError(false);
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          {
            redirectTo: `${window.location.origin}/reset-password`,
          }
        );

      if (resetError) {
        throw resetError;
      }

      setMessage(
        "If an account exists for this email, a password-reset link will be sent. Please check your inbox."
      );
    } catch (err) {
      setError(true);
      setMessage(
        err instanceof Error
          ? err.message
          : "Unable to send the reset email. Please try again."
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
          Forgot your password?
        </h1>

        <p className="mb-8 text-sm text-slate-400">
          Enter your registered email address. We&apos;ll send you a link to reset your password.
        </p>

        <form onSubmit={handleResetRequest} className="space-y-5">
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

          {message && (
            <p
              role={error ? "alert" : "status"}
              aria-live="polite"
              className={`rounded-lg border p-3 text-sm ${
                error
                  ? "border-red-400/20 bg-red-400/10 text-red-300"
                  : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending email..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Remembered your password?{" "}
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
