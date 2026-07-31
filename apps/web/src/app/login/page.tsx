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
    <main className="min-h-screen bg-[#0C0B0A] text-[#F3F2EF] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6557F5]/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#E55B3C]/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Login Card Container */}
      <div className="w-full max-w-md bg-[#161512]/80 border border-[#2E2B26] rounded-md p-8 md:p-10 flex flex-col gap-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] backdrop-blur-md relative z-10 animate-fade-in">
        {/* Ember Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#6557F5] via-[#E55B3C] to-[#6557F5] rounded-t-md" />

        {/* Card Header & Branding */}
        <div className="flex flex-col items-center gap-3 text-center">
          {/* Logo Icon representation */}
          <div className="w-12 h-16 rounded border border-graphite-secondary hover:border-iris-primary flex items-center justify-center relative p-1.5 transition-all">
            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-[#E55B3C] absolute right-2 top-[calc(50%-5px)] transform translate-x-1/2" />
            <span className="text-[9px] font-mono text-graphite-tertiary">9:16</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#F3F2EF]">TribeV2 Ad Scorer</h1>
            <p className="text-[11px] text-graphite-secondary mt-1 tracking-wide font-mono uppercase">
              Neuromarketing Creative AI
            </p>
          </div>
        </div>

        {/* Description body */}
        <div className="text-center text-xs text-graphite-secondary leading-relaxed px-4">
          Authenticate using your workspace identity to access creative optimization scoring, 
          HCP brain maps, and LLM summary handoffs.
        </div>

        {/* OAuth Trigger Area */}
        <div className="flex flex-col gap-4">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-[#F2786C] p-3.5 rounded text-[11px] leading-relaxed font-mono">
              <span className="font-bold">Error: </span>
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#1F1D19] border border-[#3E3A33] hover:border-[#6557F5] rounded text-xs font-semibold text-[#F3F2EF] transition-all disabled:opacity-50 hover:bg-[#25231F] active:scale-[0.98] shadow-md group cursor-pointer"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-iris-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4 transition-transform group-hover:scale-105" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
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
        <div className="text-[10px] text-graphite-tertiary text-center leading-relaxed font-sans">
          By signing in, you agree to the workspace terms of service.
          <br />
          System powered by FAIR Meta TribeV2 digital brain mapping models.
        </div>
      </div>
    </main>
  );
}
