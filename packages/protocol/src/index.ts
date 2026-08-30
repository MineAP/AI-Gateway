/**
 * Gateway Internal Model — provider-independent request/response contract
 * shared between Provider Adapters and the Compatibility Pipeline.
 */

export interface GatewayRequest {
  /** Conversation context including system prompts, tool calls, and tool results. */
  readonly messages: Message[];
  /** Tool schema definitions sent to the provider. Omitted when the client sends none. */
  readonly tools?: ToolDefinition[];
  /** Unsupported provider-specific payload preserved as-is. Never modified by compatibility logic. */
  readonly rawData: Record<string, unknown>;
}

export interface GatewayResponse {
  /** Provider response payload preserved as-is. Never modified by compatibility logic. */
  readonly rawData: Record<string, unknown>;
}

/** A single conversation message in the Internal Model. */
export interface Message {
  readonly role: "system" | "user" | "assistant" | "tool";
  /** Text content of a normal message or the output of a tool result. */
  readonly content?: string;
  /** Tool invocations requested by an assistant message. */
  readonly toolCalls?: ToolCall[];
  /** Identifier linking a tool result (role = "tool") to the tool call it answers. */
  readonly toolCallId?: string;
}

/** A tool invocation. Names are always flat, e.g. `mcp__MCP_DOCKER__browser_click`. */
export interface ToolCall {
  readonly id: string;
  readonly function: {
    readonly name: string;
    readonly arguments: unknown;
  };
}

/** A standalone function tool definition. */
export interface FunctionToolDefinition {
  readonly type: "function";
  readonly name: string;
  readonly description?: string;
  /** JSON Schema describing the function parameters. */
  readonly parameters?: object;
}

/** A namespaced group of function tools, flattened by the Compatibility Pipeline when required. */
export interface NamespaceToolDefinition {
  readonly type: "namespace";
  readonly name: string;
  readonly tools: FunctionToolDefinition[];
}

export type ToolDefinition = FunctionToolDefinition | NamespaceToolDefinition;

/**
 * A single streaming chunk of a response. Chunks are processed independently
 * while sharing one Processing Context for the duration of the stream.
 */
export interface StreamChunk {
  /** Incremental text content carried by this chunk, if any. */
  readonly delta?: string;
  /** Provider-specific chunk payload preserved as-is. Never modified by compatibility logic. */
  readonly rawData: Record<string, unknown>;
}

/**
 * Execution-time state for a single request/response lifecycle.
 * Created and discarded by the Gateway Request Dispatcher; not part of the protocol model.
 */
export interface ProcessingContext {
  /** Mutable key/value store shared across request and response phases. */
  readonly metadata: Map<string, unknown>;
}
