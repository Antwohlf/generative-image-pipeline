#!/usr/bin/env node

import path from "node:path";
import { Command } from "commander";
import type { ProviderName } from "./types.js";
import { approveAll } from "./core/approvals.js";
import { writeJson } from "./core/io.js";
import { loadManifestAndPlan } from "./core/plan.js";
import { runPipeline } from "./core/pipeline.js";

const program = new Command();

program
  .name("multitake")
  .description("Generate, compare, and approve consistent takes of the same scene")
  .version("0.1.0");

program
  .command("plan")
  .description("Expand a manifest into a stable, inspectable generation plan")
  .requiredOption("-m, --manifest <path>", "pipeline manifest")
  .option("-o, --out <path>", "plan output", "output/plan.json")
  .action(async ({ manifest, out }: { manifest: string; out: string }) => {
    const { plan } = await loadManifestAndPlan(manifest);
    await writeJson(path.resolve(out), plan);
    console.log(`Planned ${plan.jobs.length} assets`);
    console.log(`Plan hash: ${plan.planHash}`);
    console.log(path.resolve(out));
  });

program
  .command("run")
  .description("Generate or import candidates, normalize, validate, and gate release")
  .requiredOption("-m, --manifest <path>", "pipeline manifest")
  .requiredOption("-w, --work-dir <path>", "work directory")
  .option("-p, --provider <name>", "fixture, manual, or openai")
  .option("--confirm-cost", "confirm paid API generation", false)
  .action(async (options: { manifest: string; workDir: string; provider?: ProviderName; confirmCost: boolean }) => {
    const report = await runPipeline({
      manifestPath: options.manifest,
      workDirectory: options.workDir,
      ...(options.provider ? { provider: options.provider } : {}),
      confirmCost: options.confirmCost,
    });
    console.log(JSON.stringify(report, null, 2));
    if (report.status === "failed") process.exitCode = 1;
  });

program
  .command("approve")
  .description("Record human approval decisions")
  .requiredOption("-w, --work-dir <path>", "work directory")
  .option("--all", "approve every planned asset")
  .action(async ({ workDir, all }: { workDir: string; all?: boolean }) => {
    if (!all) throw new Error("The initial CLI supports --all; edit approvals.json for individual decisions");
    const root = path.resolve(workDir);
    await approveAll(path.join(root, "approvals.json"));
    console.log(`Approved all assets in ${path.join(root, "approvals.json")}`);
  });

program
  .command("demo")
  .description("Run the offline fixture pipeline from plan through gated release")
  .requiredOption("-m, --manifest <path>", "pipeline manifest")
  .requiredOption("-w, --work-dir <path>", "work directory")
  .action(async ({ manifest, workDir }: { manifest: string; workDir: string }) => {
    const first = await runPipeline({ manifestPath: manifest, workDirectory: workDir, provider: "fixture" });
    if (first.status === "failed") throw new Error("Fixture generation failed validation");
    await approveAll(path.join(path.resolve(workDir), "approvals.json"), first.planHash);
    const final = await runPipeline({ manifestPath: manifest, workDirectory: workDir, provider: "fixture" });
    console.log(JSON.stringify(final, null, 2));
    if (final.status !== "complete") process.exitCode = 1;
  });

program.parseAsync().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
