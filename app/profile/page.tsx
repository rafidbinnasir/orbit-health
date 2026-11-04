
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase-browser";

type AstronautProfile = {
  full_name: string;
  astronaut_id: string;
  mission_name: string | null;
  avatar_url: string | null;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProfilePage() {
  const [profile, setProfile] = useState<AstronautProfile | null>(null);
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [name, setName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const previewUrl = "";

    async function loadProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          if (active) {
            setErrorMessage("Please sign in to view your astronaut profile.");
          }
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, astronaut_id, mission_name, avatar_url")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if (!active) return;

        const loadedProfile = data as AstronautProfile;
        setProfile(loadedProfile);
        setName(loadedProfile.full_name ?? "");
        setEmail(user.email ?? "");
        setNewEmail(user.email ?? "");

        if (loadedProfile.avatar_url) {
          const { data: signedData, error: signedError } =
            await supabase.storage
              .from("astronaut-avatars")
              .createSignedUrl(loadedProfile.avatar_url, 3600);

          if (!signedError && signedData && active) {
            setPhotoPreview(signedData.signedUrl);
          }
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? `Could not load profile: ${error.message}`
              : "Could not load your profile."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      active = false;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  function choosePhoto(file?: File) {
    setErrorMessage("");
    setMessage("");

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage("Choose a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("The photo must be 5 MB or smaller.");
      return;
    }

    if (photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");
    setMessage("");

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user || !profile) {
        throw new Error("Your session may have expired. Please sign in again.");
      }

      const cleanName = name.trim();
      const cleanEmail = newEmail.trim();

      if (!cleanName) {
        throw new Error("Please enter your full name.");
      }

      let avatarPath = profile.avatar_url;

      if (photoFile) {
        const extension = photoFile.type === "image/png"
          ? "png"
          : photoFile.type === "image/webp"
            ? "webp"
            : "jpg";

        // Each user has their own folder. A stable filename
        // lets the user replace their existing photo.
        const filePath = `${user.id}/avatar.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("astronaut-avatars")
          .upload(filePath, photoFile, {
            upsert: true,
            contentType: photoFile.type,
            cacheControl: "3600",
          });

        if (uploadError) throw uploadError;
        avatarPath = filePath;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: cleanName,
          avatar_url: avatarPath,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      setProfile({ ...profile, full_name: cleanName, avatar_url: avatarPath });
      setPhotoFile(null);

      if (avatarPath) {
        const { data: signedData, error: signedError } =
          await supabase.storage
            .from("astronaut-avatars")
            .createSignedUrl(avatarPath, 3600);

        if (!signedError && signedData) {
          setPhotoPreview(signedData.signedUrl);
        }
      }

      if (cleanEmail.toLowerCase() !== (user.email ?? "").toLowerCase()) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: cleanEmail,
        });

        if (emailError) throw emailError;

        setMessage(
          "Profile saved. Check your email for the confirmation instructions to finish changing your email address."
        );
        setEditing(false);
      } else {
        setMessage("Your profile has been saved.");
        setEmail(user.email ?? "");
        setNewEmail(user.email ?? "");
        setEditing(false);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8 text-slate-900 dark:bg-slate-950 dark:text-white">
        Loading astronaut profile...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-900 dark:bg-slate-950 dark:text-white">
      <section className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-sm text-cyan-600 hover:underline dark:text-cyan-400"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <p className="text-sm font-semibold tracking-widest text-cyan-600 dark:text-cyan-400">
            ORBIT HEALTH
          </p>
          <h1 className="mt-2 text-3xl font-bold">Astronaut Profile</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Manage your astronaut identity.
          </p>

          {errorMessage && (
            <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {errorMessage}
            </p>
          )}
          {message && (
            <p role="status" className="mt-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {message}
            </p>
          )}

          {profile && (
            <>
              <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950 sm:flex-row">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-3xl font-bold text-cyan-700 dark:text-cyan-300">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoPreview}
                      alt="Astronaut profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (name.trim().charAt(0).toUpperCase() || "A")
                  )}
                </div>

                <div className="min-w-0 text-center sm:text-left">
                  <p className="text-lg font-bold">{profile.full_name}</p>
                  <p className="mt-1 font-mono text-sm text-cyan-700 dark:text-cyan-300">
                    {profile.astronaut_id}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {profile.mission_name || "Mission not assigned"}
                  </p>
                </div>
              </div>

              {editing ? (
                <form onSubmit={handleSave} className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="avatar" className="mb-2 block text-sm font-medium">
                      Profile photo
                    </label>
                    <input
                      ref={fileInput}
                      id="avatar"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => choosePhoto(event.target.files?.[0])}
                      className="block w-full cursor-pointer rounded-lg border border-slate-300 p-3 text-sm dark:border-slate-700"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      JPEG, PNG or WebP; maximum 5 MB.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="full-name" className="mb-2 block text-sm font-medium">
                      Full name
                    </label>
                    <input
                      id="full-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      maxLength={100}
                      autoComplete="name"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={newEmail}
                      onChange={(event) => setNewEmail(event.target.value)}
                      required
                      autoComplete="email"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-950"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Supabase may ask you to confirm the new email.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Astronaut ID
                    </label>
                    <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 font-mono text-sm dark:border-slate-800 dark:bg-slate-800">
                      {profile.astronaut_id}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="cursor-pointer rounded-lg bg-cyan-600 px-5 py-2.5 font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        setName(profile.full_name);
                        setNewEmail(email);
                        setPhotoFile(null);
                        setPhotoPreview("");
                        setEditing(false);
                        setErrorMessage("");
                        setMessage("");
                        if (fileInput.current) fileInput.current.value = "";
                      }}
                      className="cursor-pointer rounded-lg border border-slate-300 px-5 py-2.5 font-semibold transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="mt-6 space-y-3">
                    <InfoRow label="Full name" value={profile.full_name} />
                    <InfoRow label="Astronaut ID" value={profile.astronaut_id} />
                    <InfoRow label="Email" value={email || "Not available"} />
                    <InfoRow
                      label="Mission name"
                      value={profile.mission_name || "Not assigned yet"}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setName(profile.full_name);
                      setNewEmail(email);
                      setEditing(true);
                      setMessage("");
                      setErrorMessage("");
                    }}
                    className="mt-6 w-full cursor-pointer rounded-lg bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-700"
                  >
                    Edit profile
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}
