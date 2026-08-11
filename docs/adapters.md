# Generation adapters

## Manual and agent-assisted

The `manual` adapter writes one JSON request per planned asset into `requests/`. Each request includes the prompt, reference paths, output contract, hashes, and the expected filename.

Generate those images with Codex, another agent, or a design tool. Place completed files into `inbox/` using the expected filenames, then rerun the same command. The adapter imports them without changing the plan.

```bash
pnpm gip run --manifest examples/seasonal-scenes/pipeline.json --work-dir work/seasonal --provider manual
```

## OpenAI

The `openai` adapter uses the Image API. Jobs with references use image edits; jobs without references use image generation. The default model is the pinned `gpt-image-2-2026-04-21` snapshot.

Paid generation requires both `OPENAI_API_KEY` and the explicit `--confirm-cost` flag.

```bash
OPENAI_API_KEY=... pnpm gip run \
  --manifest examples/seasonal-scenes/pipeline.json \
  --work-dir work/seasonal \
  --provider openai \
  --confirm-cost
```

## Fixture

The `fixture` adapter creates deterministic synthetic images from each job fingerprint. It exists for tests, CI, documentation, and pipeline development. It does not call a model.
