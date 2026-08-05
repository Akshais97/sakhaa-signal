import { redirect } from "next/navigation";
import { getAuthenticatedSession } from "@/lib/auth";
import LandingPage from "./(marketing)/page";

export default async function RootPage() {
  const { user } = await getAuthenticatedSession();

  // If a real authenticated user exists, redirect to /dashboard
  if (user && user.id !== "local-dev-user") {
    redirect("/dashboard");
  }

  // Otherwise render the public marketing landing page
  return <LandingPage />;
}