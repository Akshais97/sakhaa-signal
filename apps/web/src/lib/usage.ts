import prisma from "./db";

export type AnalysisCostType = "STATIC_STANDARD" | "VIDEO_STANDARD" | "FULL_WITH_TRIBEV2" | "TRIBEV2_VIDEO_FULL";

const COST_MAP: Record<AnalysisCostType, number> = {
  STATIC_STANDARD: 1.0,      // 1 credit per static creative analysis
  VIDEO_STANDARD: 2.0,       // 2 credits per video standard analysis
  FULL_WITH_TRIBEV2: 3.0,    // 3 credits per full video TribeV2 GPU analysis
  TRIBEV2_VIDEO_FULL: 3.0,   // 3 credits alias for full video TribeV2 GPU analysis
};

/**
 * Gets or initializes the credit balance for a workspace.
 * New workspaces automatically receive 5 starter credits.
 */
export async function getOrCreateCreditBalance(workspaceId: string) {
  let balance = await prisma.creditBalance.findUnique({
    where: { workspaceId },
  });

  if (!balance) {
    balance = await prisma.creditBalance.create({
      data: {
        workspaceId,
        balance: 5.0, // Initial free trial credits
      },
    });

    // Record welcome credit allocation in ledger
    await prisma.usageLedger.create({
      data: {
        workspaceId,
        usageType: "WELCOME_BONUS",
        quantity: 5,
        unit: "CREDITS",
        creditsDelta: 5.0,
        reason: "Welcome Free Trial Credits",
      },
    });
  }

  return balance;
}

/**
 * Checks if workspace has sufficient credits and reserves them before running an analysis.
 */
export async function reserveAnalysisCredits(
  workspaceId: string,
  analysisType: AnalysisCostType,
  jobId?: string
): Promise<{ success: boolean; requiredCredits: number; remainingBalance: number; error?: string }> {
  const cost = COST_MAP[analysisType] || 1.0;
  const balanceRecord = await getOrCreateCreditBalance(workspaceId);
  const currentBalance = Number(balanceRecord.balance);

  if (currentBalance < cost) {
    return {
      success: false,
      requiredCredits: cost,
      remainingBalance: currentBalance,
      error: `Insufficient credits. Analysis requires ${cost} credits, but workspace balance is ${currentBalance.toFixed(1)} credits. Please upgrade your plan or purchase top-up credits.`,
    };
  }

  // Deduct credits
  const updatedBalance = await prisma.creditBalance.update({
    where: { workspaceId },
    data: {
      balance: {
        decrement: cost,
      },
    },
  });

  // Record transaction in UsageLedger
  await prisma.usageLedger.create({
    data: {
      workspaceId,
      analysisJobId: jobId || null,
      usageType: analysisType,
      quantity: 1,
      unit: "ANALYSIS",
      creditsDelta: -cost,
      reason: `Reserved credits for ${analysisType} execution`,
    },
  });

  return {
    success: true,
    requiredCredits: cost,
    remainingBalance: Number(updatedBalance.balance),
  };
}

/**
 * Refunds credits to workspace if analysis job fails fatally.
 */
export async function refundAnalysisCredits(
  workspaceId: string,
  analysisType: AnalysisCostType,
  jobId: string,
  reason: string
): Promise<void> {
  const cost = COST_MAP[analysisType] || 1.0;

  await prisma.creditBalance.update({
    where: { workspaceId },
    data: {
      balance: {
        increment: cost,
      },
    },
  });

  await prisma.usageLedger.create({
    data: {
      workspaceId,
      analysisJobId: jobId,
      usageType: "REFUND",
      quantity: 1,
      unit: "ANALYSIS",
      creditsDelta: cost,
      reason: `Refunded ${cost} credits due to failure: ${reason}`,
    },
  });
}
