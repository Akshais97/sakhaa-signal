"use client";

import React, { type FormEvent, useMemo, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

type AuthMode = "signIn" | "signUp";

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  const destination = () => {
    const requested = new URLSearchParams(window.location.search).get("next");
    return requested?.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/dashboard";
  };

  const handlePasswordAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (mode === "signUp") {
        const cleanUsername = username.trim();
        if (cleanUsername.length < 3 || cleanUsername.length > 64) {
          throw new Error("Username must be between 3 and 64 characters.");
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { username: cleanUsername, full_name: cleanUsername },
          },
        });
        if (error) throw error;
        if (data.session) {
          window.location.assign(destination());
          return;
        }
        setSuccessMsg("Account created. Check your email to confirm it, then sign in.");
        setMode("signIn");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        window.location.assign(destination());
        return;
      }
    } catch (error: unknown) {
      console.error("[PASSWORD_AUTH_ERROR]", error);
      setErrorMsg(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination())}` },
      });
      if (error) throw error;
    } catch (error: unknown) {
      console.error("[OAUTH_LOGIN_ERROR]", error);
      setErrorMsg(error instanceof Error ? error.message : "Failed to initialize Google login.");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-graphite-strong bg-[#151411] px-3.5 py-3 text-sm text-graphite-primary outline-none transition-colors placeholder:text-graphite-tertiary focus:border-iris-primary";

  return (
    <main className="min-h-screen dashboard-canvas text-graphite-primary flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md rounded-md border border-graphite-subtle bg-graphite-sunken/90 p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] md:p-10">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <div className="relative flex h-16 w-12 items-center justify-center rounded border border-graphite-strong bg-[#0C0B02] p-1.5" aria-hidden="true">
            <div className="absolute right-2 top-[calc(50%-5px)] h-0 w-0 translate-x-1/2 border-b-[5px] border-l-[8px] border-t-[5px] border-b-transparent border-l-ember-creative border-t-transparent" />
            <span className="font-mono text-xs text-graphite-tertiary">9:16</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold">Sakhaa Signal</h1>
            <p className="mt-1 font-mono text-sm tracking-wide text-graphite-secondary">Neuromarketing creative studio</p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-md border border-graphite-subtle bg-[#11100E] p-1" role="tablist" aria-label="Authentication mode">
          {(["signIn", "signUp"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => { setMode(value); setErrorMsg(""); setSuccessMsg(""); }}
              className={`rounded px-3 py-2 text-sm font-semibold transition-colors ${mode === value ? "bg-[#25231F] text-white" : "text-graphite-secondary hover:text-white"}`}
            >
              {value === "signIn" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form className="flex flex-col gap-4" onSubmit={handlePasswordAuth}>
          {mode === "signUp" && (
            <label className="flex flex-col gap-1.5 text-sm text-graphite-secondary">
              Username
              <input name="username" autoComplete="username" minLength={3} maxLength={64} required value={username} onChange={(event) => setUsername(event.target.value)} className={inputClass} placeholder="Your display name" />
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm text-graphite-secondary">
            Email
            <input name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="you@example.com" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-graphite-secondary">
            Password
            <input name="password" type="password" autoComplete={mode === "signUp" ? "new-password" : "current-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} placeholder="At least 8 characters" />
          </label>

          {errorMsg && <div className="rounded-md border border-[#F2786C]/30 bg-[rgba(242,120,108,0.08)] p-3 text-sm text-[#F2786C]" role="alert">{errorMsg}</div>}
          {successMsg && <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300" role="status">{successMsg}</div>}

          <button type="submit" disabled={loading} className="rounded-md bg-iris-primary px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50">
            {loading ? "Please wait…" : mode === "signIn" ? "Sign in with email" : "Create account"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-graphite-tertiary"><span className="h-px flex-1 bg-graphite-subtle" /><span>OR</span><span className="h-px flex-1 bg-graphite-subtle" /></div>

        <button type="button" onClick={handleGoogleLogin} disabled={loading} className="w-full rounded-md border border-graphite-strong bg-[#1F1D19] px-4 py-3 text-sm font-semibold transition-colors hover:border-iris-primary disabled:opacity-50">
          Sign in with Google
        </button>

        <p className="mt-6 text-center text-xs leading-relaxed text-graphite-tertiary">By signing in, you agree to the workspace terms of service.</p>
      </div>
    </main>
  );
}
