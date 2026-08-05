import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/auth";
import { PLANS } from "@/lib/billing";

export async function POST(req: NextRequest) {
  try {
    const { user, workspace: ws } = await getAuthenticatedSession();
    if (!user || !ws) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planCode } = await req.json();
    const targetPlan = PLANS[planCode || "GROWTH"];

    if (!targetPlan) {
      return NextResponse.json({ error: "Invalid plan code" }, { status: 400 });
    }

    // Return checkout URL or mock session URL for Stripe
    const mockCheckoutUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings/billing?status=success&plan=${targetPlan.code}`;

    return NextResponse.json({
      url: mockCheckoutUrl,
      plan: targetPlan,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Checkout error", details: error.message }, { status: 500 });
  }
}
