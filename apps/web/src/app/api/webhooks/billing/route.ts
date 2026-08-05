import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { PLANS } from "@/lib/billing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body.type || "checkout.session.completed";

    if (eventType === "checkout.session.completed" || eventType === "invoice.paid") {
      const workspaceId = body.data?.object?.metadata?.workspaceId;
      const planCode = body.data?.object?.metadata?.planCode || "GROWTH";

      if (workspaceId) {
        const plan = PLANS[planCode] || PLANS.GROWTH;

        // Upsert subscription
        await prisma.subscription.upsert({
          where: { id: `sub_${workspaceId}` },
          update: {
            planCode: plan.code,
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          create: {
            id: `sub_${workspaceId}`,
            workspaceId,
            provider: "stripe",
            providerSubscriptionId: body.data?.object?.subscription || `sub_mock_${Date.now()}`,
            planCode: plan.code,
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        // Top up credits
        await prisma.creditBalance.upsert({
          where: { workspaceId },
          update: {
            balance: { increment: plan.monthlyCredits },
          },
          create: {
            workspaceId,
            balance: plan.monthlyCredits,
          },
        });

        // Ledger record
        await prisma.usageLedger.create({
          data: {
            workspaceId,
            usageType: "SUBSCRIPTION_RENEWAL",
            quantity: plan.monthlyCredits,
            unit: "CREDITS",
            creditsDelta: plan.monthlyCredits,
            reason: `Subscribed to ${plan.name}`,
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Webhook handler failed", details: error.message }, { status: 400 });
  }
}
