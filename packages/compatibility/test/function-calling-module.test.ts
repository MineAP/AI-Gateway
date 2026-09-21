import type { GatewayRequest, ToolDefinition } from "@ai-gateway/protocol";

import { describe, expect, it } from "vitest";

import { functionCallingModule } from "../src/index.js";

const context = { metadata: new Map<string, unknown>() };

function makeRequest(tools?: ToolDefinition[]): GatewayRequest {
  return { messages: [], tools, rawData: {} };
}

async function processRequest(
  request: GatewayRequest,
): Promise<GatewayRequest> {
  const handler = functionCallingModule.processRequest;
  if (!handler) throw new Error("processRequest is not implemented");
  return handler(request, context);
}

describe("functionCallingModule", () => {
  it("flattens namespace tools into <namespace>__<tool> function names", async () => {
    const request = makeRequest([
      {
        type: "namespace",
        name: "mcp__MCP_DOCKER",
        tools: [
          { type: "function", name: "browser_click" },
          { type: "function", name: "browser_snapshot" },
        ],
      },
    ]);

    const result = await processRequest(request);

    expect(result.tools).toEqual([
      { type: "function", name: "mcp__MCP_DOCKER__browser_click" },
      { type: "function", name: "mcp__MCP_DOCKER__browser_snapshot" },
    ]);
  });

  it("preserves description and parameters of flattened tools", async () => {
    const request = makeRequest([
      {
        type: "namespace",
        name: "ns",
        tools: [
          {
            type: "function",
            name: "click",
            description: "Click an element",
            parameters: {
              type: "object",
              properties: { x: { type: "number" } },
            },
          },
        ],
      },
    ]);

    const result = await processRequest(request);

    expect(result.tools).toEqual([
      {
        type: "function",
        name: "ns__click",
        description: "Click an element",
        parameters: { type: "object", properties: { x: { type: "number" } } },
      },
    ]);
  });

  it("keeps standalone function tools unchanged and preserves order", async () => {
    const request = makeRequest([
      { type: "function", name: "search" },
      {
        type: "namespace",
        name: "ns",
        tools: [{ type: "function", name: "inner" }],
      },
      { type: "function", name: "summarize" },
    ]);

    const result = await processRequest(request);

    expect(result.tools?.map((tool) => tool.name)).toEqual([
      "search",
      "ns__inner",
      "summarize",
    ]);
  });

  it("returns the original request when no tools are present", async () => {
    const request = makeRequest();

    const result = await processRequest(request);

    expect(result).toBe(request);
  });

  it("returns the original request when only standalone tools are present", async () => {
    const request = makeRequest([{ type: "function", name: "search" }]);

    const result = await processRequest(request);

    expect(result).toBe(request);
  });

  it("removes namespace entries with no tools", async () => {
    const request = makeRequest([
      { type: "namespace", name: "empty", tools: [] },
      { type: "function", name: "keep" },
    ]);

    const result = await processRequest(request);

    expect(result.tools?.map((tool) => tool.name)).toEqual(["keep"]);
  });

  it("throws when flattening produces duplicate tool names", async () => {
    const request = makeRequest([
      {
        type: "namespace",
        name: "ns",
        tools: [
          { type: "function", name: "x" },
          { type: "function", name: "x" },
        ],
      },
    ]);

    await expect(processRequest(request)).rejects.toThrow(
      "Duplicate tool name: ns__x",
    );
  });

  it("throws when a standalone tool collides with a flattened name", async () => {
    const request = makeRequest([
      { type: "function", name: "ns__inner" },
      {
        type: "namespace",
        name: "ns",
        tools: [{ type: "function", name: "inner" }],
      },
    ]);

    await expect(processRequest(request)).rejects.toThrow(
      "Duplicate tool name: ns__inner",
    );
  });

  it("throws when the input already contains duplicate standalone names", async () => {
    const request = makeRequest([
      { type: "function", name: "dup" },
      { type: "function", name: "dup" },
    ]);

    await expect(processRequest(request)).rejects.toThrow(
      "Duplicate tool name: dup",
    );
  });

  it("does not implement processResponse (response pass-through)", () => {
    expect(functionCallingModule.processResponse).toBeUndefined();
  });
});
