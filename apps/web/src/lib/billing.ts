export interface PlanConfig {
  code: string;
  name: string;
  monthlyPrice: number;
  monthlyCredits: number;
  maxWorkspaces: number;
  maxMembers: number;
  features: string[];
}

export const PLANS: Record<string, PlanConfig> = {
  STARTER: {
    code: "STARTER",
    name: "Starter Plan",
    monthlyPrice: 49,
    monthlyCredits: 20,
    maxWorkspaces: 1,
    maxMembers: 2,
    features: [
      "Static Image Saliency & Focal Analysis",
      "EP, VP, CS, BR Biometric Scoring",
      "20 Credits / month",
      "1 Workspace & 2 Team Seats",
    ],
  },
  GROWTH: {
    code: "GROWTH",
    name: "Growth Plan",
    monthlyPrice: 149,
    monthlyCredits: 100,
    maxWorkspaces: 5,
    maxMembers: 10,
    features: [
      "Full TribeV2 Transformer GPU Inference",
      "17 Cognitive Cluster Activations (A–Q)",
      "LLM Executive Summary Reports",
      "100 Credits / month",
      "5 Workspaces & 10 Team Seats",
    ],
  },
  PRO: {
    code: "PRO",
    name: "Pro Enterprise Plan",
    monthlyPrice: 399,
    monthlyCredits: 350,
    maxWorkspaces: 99,
    maxMembers: 99,
    features: [
      "High Volume TribeV2 GPU Processing",
      "Training Bundle ML Export (.pt / .npy)",
      "350 Credits / month",
      "Unlimited Workspaces & Members",
    ],
  },
};
