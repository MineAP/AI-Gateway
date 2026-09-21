import { functionCallingModule } from "./function-calling-module.js";

import type { CompatibilityProfile } from "./profile.js";

/**
 * REQ-001 compatibility profile for the OpenAI Responses API / LM Studio (Qwen) path.
 */
export const openaiResponsesProfile: CompatibilityProfile = {
  name: "openai-responses",
  modules: [functionCallingModule],
};
