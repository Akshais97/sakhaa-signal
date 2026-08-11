import { redirect } from "next/navigation";
import { getAuthenticatedSession } from "@/lib/auth";
import LandingPage from "./(marketing)/page";

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  try {
    const { code, next } = await searchParams;

    // If Supabase redirected OAuth code directly to root URL (/?code=...), forward to /auth/callback
    if (code) {
      redirect(`/auth/callback?code=${encodeURIComponent(code)}${next ? `&next=${encodeURIComponent(next)}` : ""}`);
    }

    const { user } = await getAuthenticatedSession();

    // If a real authenticated user exists, redirect to /dashboard
    if (user && user.id !== "local-dev-user") {
      redirect("/dashboard");
    }
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT") || err?.message === "NEXT_REDIRECT") {
      throw err;
    }
    console.error("[ROOT PAGE RENDER ERROR]", err);
  }

  // Otherwise render the public marketing landing page
  return <LandingPage />;
}