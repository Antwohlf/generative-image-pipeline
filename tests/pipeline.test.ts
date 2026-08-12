import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { approveAll } from "../src/core/approvals.js";
import { runPipeline } from "../src/core/pipeline.js";

const manifestPath = path.resolve("examples/seasonal-scenes/pipeline.json");

describe("offline fixture pipeline", () => {
  it("runs from a stable plan through an approved release", async () => {
    const workDirectory = await mkdtemp(path.join(os.tmpdir(), "multitake-"));
    const first = await runPipeline({ manifestPath, workDirectory, provider: "fixture" });
    expect(first.status).toBe("awaiting_approval");
    expect(first.counts.total).toBe(8);

    await approveAll(path.join(workDirectory, "approvals.json"), first.planHash);
    const final = await runPipeline({ manifestPath, workDirectory, provider: "fixture" });
    expect(final.status).toBe("complete");
    expect(final.files.releaseManifest).toBe("release-manifest.json");

    const release = JSON.parse(await readFile(path.join(workDirectory, "release-manifest.json"), "utf8")) as { assets: unknown[] };
    expect(release.assets).toHaveLength(8);
  }, 30_000);
});
