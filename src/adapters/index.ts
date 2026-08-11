import type { ProviderName } from "../types.js";
import type { GenerationAdapter } from "./types.js";
import { fixtureAdapter } from "./fixture.js";
import { manualAdapter } from "./manual.js";
import { openAIAdapter } from "./openai.js";

const adapters: Record<ProviderName, GenerationAdapter> = {
  fixture: fixtureAdapter,
  manual: manualAdapter,
  openai: openAIAdapter,
};

export const getAdapter = (name: ProviderName): GenerationAdapter => adapters[name];
