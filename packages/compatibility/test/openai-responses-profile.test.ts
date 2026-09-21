import type { GatewayRequest, ToolDefinition } from "@ai-gateway/protocol";

import { describe, expect, it } from "vitest";

import { CompatibilityPipeline, openaiResponsesProfile } from "../src/index.js";

const context = { metadata: new Map<string, unknown>() };

function makeRequest(tools?: ToolDefinition[]): GatewayRequest {
  return { messages: [], tools, rawData: {} };
}

function buildPipeline(): CompatibilityPipeline {
  const pipeline = new CompatibilityPipeline();
  for (const module of openaiResponsesProfile.modules) {
    pipeline.register(module);
  }
  return pipeline;
}

describe("openaiResponsesProfile", () => {
  it("is named openai-responses and contains the function calling module", () => {
    expect(openaiResponsesProfile.name).toBe("openai-responses");
    expect(openaiResponsesProfile.modules.map((module) => module.name)).toEqual(
      ["function-calling"],
    );
  });

  it("processes a namespaced request through the pipeline end to end", async () => {
    const pipeline = buildPipeline();

    const request = makeRequest([
      {
        type: "namespace",
        name: "mcp__MCP_DOCKER",
        tools: [{ type: "function", name: "browser_click" }],
      },
    ]);

    const result = await pipeline.processRequest(request, context);

    expect(result.tools).toEqual([
      { type: "function", name: "mcp__MCP_DOCKER__browser_click" },
    ]);
  });

  it("passes responses through unchanged", async () => {
    const pipeline = buildPipeline();

    const response = { rawData: { id: "resp_1" } };

    const result = await pipeline.processResponse(response, context);

    expect(result).toBe(response);
  });
});
