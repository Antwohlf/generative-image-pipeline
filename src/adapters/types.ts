import type { PipelinePlan, PlanJob, ProviderName } from "../types.js";

export interface GenerateContext {
  job: PlanJob;
  plan: PipelinePlan;
  manifestDirectory: string;
  destination: string;
  requestDirectory: string;
  inboxDirectory: string;
  confirmCost: boolean;
}

export interface GenerateResult {
  status: "generated" | "imported" | "pending" | "skipped";
  requestPath?: string;
}

export interface GenerationAdapter {
  name: ProviderName;
  generate(context: GenerateContext): Promise<GenerateResult>;
}
