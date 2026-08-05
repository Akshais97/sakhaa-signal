"use client";

import React, { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Google will redirect back to /auth/callback route
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("[OAUTH LOGIN ERROR]", error);
      setErrorMsg(error.message || "Failed to initialize login with Google.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen dashboard-canvas text-graphite-primary flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Login Card Container */}
      <div className="w-full max-w-md bg-graphite-sunken/90 border border-graphite-subtle rounded-md p-8 md:p-10 flex flex-col gap-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative z-10">
        {/* Card Header & Branding */}
        <div className="flex flex-col items-center gap-3 text-center">
          {/* 9:16 vertical frame with offset Ember spark — the one Ember spend. */}
          <div className="w-12 h-16 rounded border border-graphite-strong hover:border-iris-primary flex items-center justify-center relative p-1.5 transition-colors bg-[#0C0B02]" aria-hidden="true">
            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-ember-creative absolute right-2 top-[calc(50%-5px)] transform translate-x-1/2" />
            <span className="text-xs font-mono text-graphite-tertiary leading-none">9:16</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-graphite-primary">Sakhaa Signal</h1>
            <p className="text-sm text-graphite-secondary mt-1 tracking-wide font-mono">
              Neuromarketing creative studio
            </p>
          </div>
        </div>

        {/* Description body */}
        <div className="text-center text-sm text-graphite-secondary leading-relaxed px-4">
          Authenticate using your workspace identity to access creative optimisation scoring,
          HCP brain maps, and LLM summary handoffs.
        </div>

        {/* OAuth Trigger Area */}
        <div className="flex flex-col gap-4">
          {errorMsg && (
            <div className="bg-[rgba(242,120,108,0.08)] border border-[#F2786C]/30 text-[#F2786C] p-3.5 rounded-md text-sm leading-relaxed font-mono" role="alert">
              <span className="font-bold">Error: </span>
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#1F1D19] border border-graphite-strong hover:border-iris-primary rounded-md text-sm font-semibold text-graphite-primary transition-colors disabled:opacity-50 hover:bg-[#25231F] active:scale-[0.99] cursor-pointer"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-iris-primary" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.29c1.92,-1.77 3.02,-4.38 3.02,-7.4C21.65,11.75 21.54,11.4 21.35,11.1z" fill="#4285F4" />
                  <path d="M12,20.5c2.57,0 4.71,-0.85 6.29,-2.3l-3.29,-2.6c-0.91,0.61 -2.08,0.97 -3,0.97 -2.31,0 -4.27,-1.56 -4.97,-3.66H3.63v2.68C5.2,18.78 8.39,20.5 12,20.5z" fill="#34A853" />
                  <path d="M7.03,12.91C6.86,12.38 6.76,11.82 6.76,11.25s0.1,-1.13 0.27,-1.66V6.91H3.63C3.06,8.06 2.73,9.35 2.73,10.75s0.33,2.69 0.9,3.84L7.03,12.91z" fill="#FBBC05" />
                  <path d="M12,4.75c1.4,0 2.65,0.48 3.64,1.43l2.73,-2.73C16.71,2.02 14.57,1.25 12,1.25c-3.61,0 -6.8,1.72 -8.37,4.66l3.4,2.68C7.73,6.31 9.69,4.75 12,4.75z" fill="#EA4335" />
                </g>
              </svg>
            )}
            <span>Sign in with Google</span>
          </button>
        </div>

        {/* Footer legalities */}
        <div className="text-xs text-graphite-tertiary text-center leading-relaxed font-sans">
          By signing in, you agree to the workspace terms of service.
          <br />
          System powered by Brain Neuromarketing Signal Simulation digital brain mapping models.
        </div>
      </div>
    </main>
  );
}