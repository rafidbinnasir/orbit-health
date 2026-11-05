
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase-browser";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  
async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setMessage("");
  setLoading(true);

  try {
    const supabase = createClient();

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
        },
      },
    });

    if (error) {
      if (
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already exists")
      ) {
        setMessage(
          "An account with this email may already exist. Please sign in or reset your password."
        );
      } else {
        setMessage(error.message);
      }
      return;
    }

    if (data.user && data.user.identities?.length === 0) {
      setMessage(
        "An account with this email may already exist. Please sign in or reset your password."
      );
      return;
    }

    if (data.user && data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setMessage(
      "Account created! Check your email to confirm your account, then sign in."
    );
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "Something went wrong. Please try again."
    );
  } finally {
    setLoading(false);
  }
}
  return (
  <main className="relative isolate flex min-h-screen items-center justify-start overflow-hidden bg-slate-950 px-5 py-12 pl-8 text-white md:pl-16 lg:pl-24">
      <video
  autoPlay
  muted
  loop
  playsInline
  preload="auto"
  aria-hidden="true"
  className="absolute inset-0 z-0 h-full w-full object-cover"
>
  <source src="189457-885804464.mp4" type="video/mp4" />
</video>

<div className="pointer-events-none absolute inset-0 z-10 bg-slate-950/40" />
     <section className="relative z-20 w-full max-w-[360px] rounded-xl border border-cyan-400/30 bg-slate-950/75 p-5 shadow-xl backdrop-blur-xl">
        <p className="mb-2 text-sm font-semibold tracking-widest text-cyan-400">
          ORBIT HEALTH
        </p>

       <h1 className="mb-2 text-2xl font-bold">
          Create your astronaut account
        </h1>

       <p className="mb-5 text-sm text-slate-400">
          Register to access your personal health dashboard.
        </p>

      <form onSubmit={handleSignup} className="space-y-3">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm">
              Full name
            </label>
            <input
              id="name"
              required
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
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
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              placeholder="At least 8 characters"
            />
          </div>

        {message && (
  <p
    role="status"
    aria-live="polite"
    className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-200"
  >
    {message}
  </p>
)}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-semibold text-cyan-400 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
