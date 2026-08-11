import { access } from "node:fs/promises";
import path from "node:path";
import type { ApprovalFile, PipelinePlan, ValidationReport } from "../types.js";
import { readJson, writeJson } from "./io.js";

const exists = async (filePath: string): Promise<boolean> => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const ensureApprovalFile = async (
  plan: PipelinePlan,
  filePath: string,
): Promise<ApprovalFile> => {
  if (await exists(filePath)) {
    const existing = await readJson<ApprovalFile>(filePath);
    if (existing.planHash !== plan.planHash) {
      throw new Error("Approval file belongs to a different plan");
    }
    return existing;
  }
  const approvals: ApprovalFile = {
    version: 1,
    planHash: plan.planHash,
    decisions: Object.fromEntries(plan.jobs.map((job) => [job.id, { status: "pending" }])),
  };
  await writeJson(filePath, approvals);
  return approvals;
};

export const approveAll = async (filePath: string, expectedPlanHash?: string): Promise<void> => {
  const approvals = await readJson<ApprovalFile>(filePath);
  if (expectedPlanHash && approvals.planHash !== expectedPlanHash) {
    throw new Error("Approval file belongs to a different plan");
  }
  const decidedAt = new Date().toISOString();
  for (const id of Object.keys(approvals.decisions)) {
    approvals.decisions[id] = { status: "approved", decidedAt };
  }
  await writeJson(filePath, approvals);
};

export const writeReleaseManifest = async (
  plan: PipelinePlan,
  approvals: ApprovalFile,
  validation: ValidationReport,
  candidateDirectory: string,
  outputPath: string,
): Promise<boolean> => {
  const approvedJobs = plan.jobs.filter((job) => approvals.decisions[job.id]?.status === "approved");
  const hasPending = plan.jobs.some((job) => approvals.decisions[job.id]?.status === "pending");
  const hasRejected = plan.jobs.some((job) => approvals.decisions[job.id]?.status === "rejected");
  if (!validation.valid || (plan.approval.requireAll && (hasPending || hasRejected))) return false;

  await writeJson(outputPath, {
    version: 1,
    name: plan.name,
    planHash: plan.planHash,
    assets: approvedJobs.map((job) => {
      const validationItem = validation.items.find((item) => item.id === job.id);
      return {
        id: job.id,
        fileName: job.fileName,
        path: path.join(candidateDirectory, job.fileName),
        sha256: validationItem?.sha256,
        promptHash: job.promptHash,
        fingerprint: job.fingerprint,
        variables: job.variables,
        references: job.references,
        approval: approvals.decisions[job.id],
      };
    }),
  });
  return true;
};
