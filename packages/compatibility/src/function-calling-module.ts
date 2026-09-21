import type { ToolDefinition } from "@ai-gateway/protocol";

import type { CompatibilityModule } from "./module.js";

const NAME_SEPARATOR = "__";

/**
 * Flattens namespaced tool definitions into standalone function tools named `<namespace>__<tool>` so that providers without namespace support can process them.
 */
export const functionCallingModule: CompatibilityModule = {
  name: "function-calling",

  async processRequest(request) {
    if (!request.tools) return request;

    const tools: ToolDefinition[] = [];
    let changed = false;

    for (const tool of request.tools) {
      if (tool.type !== "namespace") {
        tools.push(tool);
        continue;
      }
      changed = true;
      for (const inner of tool.tools) {
        tools.push({
          ...inner,
          name: `${tool.name}${NAME_SEPARATOR}${inner.name}`,
        });
      }
    }

    assertNoDuplicateToolNames(tools);

    return changed ? { ...request, tools } : request;
  },
};

function assertNoDuplicateToolNames(tools: readonly ToolDefinition[]): void {
  const seen = new Set<string>();
  for (const tool of tools) {
    if (seen.has(tool.name)) {
      throw new Error(`Duplicate tool name: ${tool.name}`);
    }
    seen.add(tool.name);
  }
}
