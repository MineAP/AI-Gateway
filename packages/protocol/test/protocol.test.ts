import { describe, expect, it } from "vitest";

import type {
  FunctionToolDefinition,
  GatewayRequest,
  GatewayResponse,
  Message,
  NamespaceToolDefinition,
  ProcessingContext,
  StreamChunk,
  ToolCall,
} from "../src/index.js";

function makeFunctionCallingRequest(): GatewayRequest {
  return {
    messages: [
      { role: "system", content: "You are a coding assistant." },
      { role: "user", content: "List the files in /tmp" },
      {
        role: "assistant",
        toolCalls: [
          {
            id: "call_1",
            function: { name: "shell", arguments: { cmd: "ls /tmp" } },
          },
        ],
      },
      { role: "tool", toolCallId: "call_1", content: "file_a\nfile_b" },
    ],
    tools: [
      {
        type: "function",
        name: "shell",
        description: "Run a shell command",
        parameters: {
          type: "object",
          properties: { cmd: { type: "string" } },
          required: ["cmd"],
        },
      },
      {
        type: "namespace",
        name: "mcp__MCP_DOCKER",
        tools: [
          {
            type: "function",
            name: "browser_click",
            parameters: { type: "object" },
          },
          {
            type: "function",
            name: "browser_close",
            parameters: { type: "object" },
          },
        ],
      },
    ],
    rawData: { model: "qwen3.6-27b", stream: true, prompt_cache_key: "uuid-1" },
  };
}

describe("Gateway Internal Model", () => {
  describe("object construction", () => {
    it("constructs a GatewayRequest with normalized messages and provider raw data", () => {
      const request = makeFunctionCallingRequest();

      expect(request.messages).toHaveLength(4);
      expect(request.tools).toHaveLength(2);
      expect(request.rawData).toEqual({
        model: "qwen3.6-27b",
        stream: true,
        prompt_cache_key: "uuid-1",
      });
    });

    it("constructs a GatewayRequest without tools when the client sends none", () => {
      const request: GatewayRequest = {
        messages: [{ role: "user", content: "hello" }],
        rawData: { model: "qwen3.6-27b" },
      };

      expect(request.tools).toBeUndefined();
    });

    it("constructs a GatewayResponse preserving the provider payload as raw data", () => {
      const payload = { id: "resp_1", output: [{ type: "message" }] };
      const response: GatewayResponse = { rawData: payload };

      expect(response.rawData).toEqual(payload);
      expect(Object.keys(response)).toEqual(["rawData"]);
    });

    it("constructs a StreamChunk with an incremental text delta", () => {
      const chunk: StreamChunk = {
        delta: "Hel",
        rawData: { event: "response.output_text.delta" },
      };

      expect(chunk.delta).toBe("Hel");
      expect(chunk.rawData).toEqual({ event: "response.output_text.delta" });
    });

    it("constructs a StreamChunk without a delta for non-text events", () => {
      const chunk: StreamChunk = { rawData: { event: "response.created" } };

      expect(chunk.delta).toBeUndefined();
    });
  });

  describe("serialization / deserialization", () => {
    it("round-trips a representative request through JSON", () => {
      const request = makeFunctionCallingRequest();

      const restored = JSON.parse(JSON.stringify(request)) as GatewayRequest;

      expect(restored).toEqual(request);
      expect(restored.messages[2].toolCalls?.[0]).toEqual({
        id: "call_1",
        function: { name: "shell", arguments: { cmd: "ls /tmp" } },
      });
    });

    it("round-trips a response and a streaming chunk through JSON", () => {
      const response: GatewayResponse = {
        rawData: { id: "resp_1", output: [] },
      };
      const chunk: StreamChunk = {
        delta: "world",
        rawData: { event: "response.output_text.delta" },
      };

      expect(JSON.parse(JSON.stringify(response))).toEqual(response);
      expect(JSON.parse(JSON.stringify(chunk))).toEqual(chunk);
    });
  });

  describe("ProcessingContext lifecycle", () => {
    it("starts empty for each request/response lifecycle", () => {
      const context: ProcessingContext = { metadata: new Map() };

      expect(context.metadata.size).toBe(0);
    });

    it("shares state between the request and response phases of one lifecycle", () => {
      const context: ProcessingContext = { metadata: new Map() };

      // Request phase (e.g. a Compatibility Module) writes execution state.
      context.metadata.set("flattenedToolNames", [
        "mcp__MCP_DOCKER__browser_click",
      ]);

      // Response phase of the same lifecycle reads it back.
      expect(context.metadata.get("flattenedToolNames")).toEqual([
        "mcp__MCP_DOCKER__browser_click",
      ]);
    });

    it("isolates state across lifecycles", () => {
      const first: ProcessingContext = { metadata: new Map() };
      const second: ProcessingContext = { metadata: new Map() };

      first.metadata.set("phase", "request");

      expect(second.metadata.size).toBe(0);
    });

    it("carries execution state without becoming part of the protocol model", () => {
      const request = makeFunctionCallingRequest();
      const context: ProcessingContext = { metadata: new Map() };

      context.metadata.set("moduleState", { step: 1 });

      expect(Object.keys(request)).toEqual(["messages", "tools", "rawData"]);
    });
  });

  describe("representative structures", () => {
    it("links a tool result message to the tool call it answers", () => {
      const request = makeFunctionCallingRequest();
      const assistantMessage = request.messages[2];
      const toolResult = request.messages[3];

      expect(assistantMessage.role).toBe("assistant");
      expect(toolResult.role).toBe("tool");
      expect(toolResult.toolCallId).toBe(assistantMessage.toolCalls?.[0]?.id);
    });

    it("keeps tool call names flat even when definitions are namespaced", () => {
      const toolCall: ToolCall = {
        id: "call_2",
        function: { name: "mcp__MCP_DOCKER__browser_click", arguments: {} },
      };

      expect(toolCall.function.name).toBe("mcp__MCP_DOCKER__browser_click");
    });

    it("distinguishes function and namespace tool definitions via the type discriminant", () => {
      const tools = makeFunctionCallingRequest().tools ?? [];
      const namespaced: NamespaceToolDefinition[] = tools.filter(
        (tool): tool is NamespaceToolDefinition => tool.type === "namespace",
      );
      const functions: FunctionToolDefinition[] = tools.filter(
        (tool): tool is FunctionToolDefinition => tool.type === "function",
      );

      expect(namespaced).toHaveLength(1);
      expect(functions).toHaveLength(1);
      expect(namespaced[0].tools).toHaveLength(2);
    });

    it("represents a message as plain data with only the fields its role requires", () => {
      const messages: Message[] = [
        { role: "system", content: "instructions" },
        { role: "user", content: "question" },
        { role: "assistant", toolCalls: [] },
        { role: "tool", toolCallId: "call_1", content: "result" },
      ];

      expect(messages.map((message) => message.role)).toEqual([
        "system",
        "user",
        "assistant",
        "tool",
      ]);
    });
  });
});
