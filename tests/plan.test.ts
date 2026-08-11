import { describe, expect, it } from "vitest";
import { buildPlan } from "../src/core/plan.js";
import type { PipelineManifest } from "../src/types.js";

const manifest: PipelineManifest = {
  version: 1,
  name: "test",
  variants: [{ id: "scene", references: [], variables: { subject: "a scene" } }],
  axes: { season: ["spring", "winter"], time: ["day", "night"] },
  promptTemplate: "{{subject}} in {{season}} at {{time}}",
  namingTemplate: "{{id}}_{{season}}_{{time}}.png",
  output: { width: 1024, height: 1024, fit: "cover", format: "png" },
  generation: { provider: "fixture", model: "fixture", quality: "low", retries: 0, delayMs: 0 },
  approval: { requireAll: true },
};

describe("buildPlan", () => {
  it("expands a stable cartesian product", () => {
    const first = buildPlan(manifest);
    const second = buildPlan(manifest);
    expect(first).toEqual(second);
    expect(first.jobs.map((job) => job.id)).toEqual([
      "scene-spring-day",
      "scene-spring-night",
      "scene-winter-day",
      "scene-winter-night",
    ]);
    expect(first.planHash).toHaveLength(64);
  });

  it("rejects missing prompt variables", () => {
    expect(() => buildPlan({ ...manifest, promptTemplate: "{{missing}}" })).toThrow("Missing template variable");
  });
});
