import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PipelineManifest, PipelinePlan, Scalar } from "../types.js";
import { sha256 } from "./io.js";
import { parseManifest } from "./schema.js";
import { assertSafeFileName, renderTemplate, slugify } from "./template.js";

const expandAxes = (
  entries: Array<[string, Scalar[]]>,
  index = 0,
  current: Record<string, Scalar> = {},
): Array<Record<string, Scalar>> => {
  if (index >= entries.length) return [{ ...current }];
  const entry = entries[index];
  if (!entry) return [{ ...current }];
  const [name, values] = entry;
  return values.flatMap((value) =>
    expandAxes(entries, index + 1, { ...current, [name]: value }),
  );
};

const stablePlanValue = (plan: Omit<PipelinePlan, "planHash">): string =>
  JSON.stringify(plan);

export const buildPlan = (manifest: PipelineManifest): PipelinePlan => {
  const combinations = expandAxes(Object.entries(manifest.axes));
  const jobs = manifest.variants.flatMap((variant) =>
    combinations.map((axisValues) => {
      const variables: Record<string, Scalar> = {
        id: variant.id,
        ...variant.variables,
        ...axisValues,
      };
      const idParts = [variant.id, ...Object.values(axisValues).map(slugify)];
      const id = idParts.join("-");
      const renderingVariables = { ...variables, jobId: id };
      const prompt = renderTemplate(manifest.promptTemplate, renderingVariables);
      const fileName = renderTemplate(manifest.namingTemplate, renderingVariables);
      assertSafeFileName(fileName);
      const promptHash = sha256(prompt);
      const fingerprint = sha256(JSON.stringify({
        id,
        prompt,
        references: variant.references,
        output: manifest.output,
      }));
      return {
        id,
        fileName,
        prompt,
        promptHash,
        fingerprint,
        references: [...variant.references],
        variables,
      };
    }),
  );

  const ids = new Set<string>();
  const fileNames = new Set<string>();
  for (const job of jobs) {
    if (ids.has(job.id)) throw new Error(`Duplicate job id: ${job.id}`);
    if (fileNames.has(job.fileName)) throw new Error(`Duplicate filename: ${job.fileName}`);
    ids.add(job.id);
    fileNames.add(job.fileName);
  }

  const value: Omit<PipelinePlan, "planHash"> = {
    version: 1,
    name: manifest.name,
    ...(manifest.description ? { description: manifest.description } : {}),
    output: manifest.output,
    generation: manifest.generation,
    approval: manifest.approval,
    jobs,
  };

  return { ...value, planHash: sha256(stablePlanValue(value)) };
};

export const loadManifestAndPlan = async (
  manifestPath: string,
): Promise<{ manifest: PipelineManifest; plan: PipelinePlan; manifestDirectory: string }> => {
  const absolutePath = path.resolve(manifestPath);
  const manifest = parseManifest(JSON.parse(await readFile(absolutePath, "utf8")));
  return {
    manifest,
    plan: buildPlan(manifest),
    manifestDirectory: path.dirname(absolutePath),
  };
};
