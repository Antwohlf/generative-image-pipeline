export type Scalar = string | number | boolean;

export type ImageFit = "cover" | "contain" | "fill";
export type ImageFormat = "png" | "jpeg" | "webp";
export type ProviderName = "fixture" | "manual" | "openai";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface VariantSpec {
  id: string;
  references: string[];
  variables: Record<string, Scalar>;
}

export interface PipelineManifest {
  version: 1;
  name: string;
  description?: string;
  variants: VariantSpec[];
  axes: Record<string, Scalar[]>;
  promptTemplate: string;
  namingTemplate: string;
  output: {
    width: number;
    height: number;
    fit: ImageFit;
    format: ImageFormat;
  };
  generation: {
    provider: ProviderName;
    model: string;
    quality: "low" | "medium" | "high" | "auto";
    retries: number;
    delayMs: number;
  };
  approval: {
    requireAll: boolean;
  };
}

export interface PlanJob {
  id: string;
  fileName: string;
  prompt: string;
  promptHash: string;
  fingerprint: string;
  references: string[];
  variables: Record<string, Scalar>;
}

export interface PipelinePlan {
  version: 1;
  name: string;
  description?: string;
  planHash: string;
  output: PipelineManifest["output"];
  generation: PipelineManifest["generation"];
  approval: PipelineManifest["approval"];
  jobs: PlanJob[];
}

export interface ApprovalDecision {
  status: ApprovalStatus;
  note?: string;
  decidedAt?: string;
}

export interface ApprovalFile {
  version: 1;
  planHash: string;
  decisions: Record<string, ApprovalDecision>;
}

export interface ValidationItem {
  id: string;
  fileName: string;
  sha256?: string;
  width?: number;
  height?: number;
  format?: string;
  valid: boolean;
  errors: string[];
}

export interface ValidationReport {
  version: 1;
  planHash: string;
  valid: boolean;
  items: ValidationItem[];
  duplicateGroups: string[][];
}

export interface PipelineRunReport {
  version: 1;
  planHash: string;
  provider: ProviderName;
  status: "complete" | "awaiting_generation" | "awaiting_approval" | "failed";
  counts: {
    total: number;
    generated: number;
    imported: number;
    skipped: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  files: {
    plan: string;
    approvals: string;
    validation?: string;
    contactSheet?: string;
    releaseManifest?: string;
  };
}
