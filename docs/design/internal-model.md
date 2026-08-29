# Gateway Internal Model

> The Gateway Internal Model is the canonical contract used inside AI Gateway.
> All provider-specific protocols are converted to this model before compatibility
> processing and converted back before transmission.

## Purpose

The Gateway internally uses a provider-independent model to isolate
provider-specific protocol differences from compatibility logic.

This document defines the internal contract shared between:

- Provider Adapters
- Compatibility Pipeline
- Future compatibility modules

The initial implementation (REQ-001) focuses on Function Calling
compatibility, but the Internal Model is designed to support additional
compatibility features without changing the adapter interfaces.

See also: [request-flow.md](request-flow.md) for how the Internal Model flows through the request and response lifecycle.

---

# Glossary

| Term | Description |
|------|-------------|
| Provider | LLM service (OpenAI, LM Studio, etc.) |
| Provider Adapter | Converts between provider protocol and Internal Model |
| Internal Model | Provider-independent canonical representation used inside Gateway |
| Compatibility Pipeline | Applies compatibility transformations to the Internal Model |
| Raw Data | Original provider payload preserved for unsupported fields |

---

# Architecture Overview

```text
                   HTTP Request
                         │
                         ▼
                +------------------+
                | Provider Adapter |
                +------------------+
                         │
                         │ Request
                         ▼
                +------------------+
                |                  |
                |  Internal Model  |
                |                  |
                +------------------+
                         │
                         ▼
           +------------------------------+
           | Compatibility Pipeline       |
           |------------------------------|
           | • Function Calling           |
           | • Future compatibility       |
           |   modules (etc.)             |
           +------------------------------+
                         │
                         ▼
                +------------------+
                |  Internal Model  |
                +------------------+
                         │
                         │ Request
                         ▼
                +------------------+
                | Provider Adapter |
                +------------------+
                         │
                         ▼
                  Provider (LLM)



                  HTTP Response
                         ▲
                         │
                +------------------+
                | Provider Adapter |
                +------------------+
                         │
                         │ Response
                         ▼
                +------------------+
                |  Internal Model  |
                +------------------+
                         │
                         ▼
           +------------------------------+
           | Compatibility Pipeline       |
           |------------------------------|
           | • Function Calling           |
           | • Future compatibility       |
           |   modules (etc.)             |
           +------------------------------+
                         │
                         ▼
                +------------------+
                |  Internal Model  |
                +------------------+
                         │
                         │ Response
                         ▼
                +------------------+
                | Provider Adapter |
                +------------------+
                         │
                         ▼
                    Codex Client
```

**Notes**

- Provider Adapters are responsible only for protocol conversion.
- Compatibility logic is isolated inside the Compatibility Pipeline.
- The Internal Model is the only contract shared between adapters and compatibility modules.
- Unsupported provider-specific data is preserved as Raw Data.

---

# Design Principles

## 1. Provider Independence

The Compatibility Pipeline must not depend on provider-specific JSON.

Instead, it operates only on the Internal Model.

---

## 2. Raw Data Preservation

Raw Data is preserved at the **top level** of each Internal Model type in a dedicated `rawData` field.

This separates normalized fields (which compatibility modules may read and modify) from provider-specific pass-through data (which must not be touched by compatibility logic).

---

## 3. Request / Response Context

Some future compatibility features may require information generated during
Request processing to be available during Response processing. Such state is
carried in the Processing Context, not within Internal Model types.

REQ-001 does not generate cross-phase state. Request-side flat tool names are
self-contained, and the Response is passed through without compatibility
transformation.

---

## 4. Compatibility Modules

The Compatibility Pipeline may contain multiple compatibility modules.

Examples include:

- Function Calling compatibility (REQ-001)
- Streaming compatibility
- Provider capability normalization
- Future protocol compatibility modules

Each module operates only on the Internal Model.

---

# Internal Model Types

## Request / Response

```typescript
interface InternalRequest {
  readonly messages: InternalMessage[];
  readonly tools?: InternalToolDefinition[];
  readonly rawData: Record<string, unknown>;
}

interface InternalResponse {
  readonly rawData: Record<string, unknown>;
}
```

### Field Semantics

| Field | Responsibility | Modified By |
|-------|---------------|-------------|
| `messages` | Conversation context including system prompts and tool calls | Preserved by REQ-001; future modules may transform it |
| `tools` | Tool schema definitions sent to the provider | Compatibility Pipeline (namespace transformation) |
| `rawData` | Unsupported provider-specific payload | None (preserved as-is) |

---

## Message

```typescript
interface InternalMessage {
  readonly role: "system" | "user" | "assistant" | "tool";
  readonly content?: string;
  readonly toolCalls?: InternalToolCall[];
  readonly toolCallId?: string;
}
```

- `role = "assistant"` with `toolCalls` indicates the model requested tool invocations.
- `role = "tool"` with `toolCallId` and `content` carries a tool result back to the assistant.

---

## Tool Call & Tool Definition

The Internal Model separates tool definitions (which may be namespaced) from tool calls (which are always flat).

```typescript
interface InternalToolCall {
  readonly id: string;
  readonly function: {
    readonly name: string;
    readonly arguments: unknown;
  };
}

interface InternalFunctionToolDefinition {
  readonly type: "function";
  readonly name: string;
  readonly description?: string;
  readonly parameters?: object;
}

interface InternalNamespaceToolDefinition {
  readonly type: "namespace";
  readonly name: string;
  readonly tools: InternalFunctionToolDefinition[];
}

type InternalToolDefinition =
  | InternalFunctionToolDefinition
  | InternalNamespaceToolDefinition;
```

- Tool calls always carry a flat `function.name`. When the original definition was namespaced, the name follows `<namespace>__<tool>` convention (e.g., `mcp__MCP_DOCKER__browser_click`).
- Namespace grouping is expressed only in `InternalToolDefinition`; tool calls never carry namespace structure.

### Structural Transformation in Compatibility Pipeline

The Compatibility Pipeline normalizes tool structures for providers that do not support namespaced representations.

| Phase | Direction | Purpose |
|-------|-----------|---------|
| `processRequest()` | Namespace → Flat | Convert namespace tool definitions to flat form using `<namespace>__<tool>` naming. Provider receives flat tool names matching Codex internal identifiers. |

This design ensures that:

- Provider Adapters handle only protocol-specific parsing and serialization.
- Structural transformation logic is encapsulated within the Compatibility Pipeline.
- Response processing requires no structural restoration: provider returns tool calls with flat names (e.g., `mcp__MCP_DOCKER__browser_click`), which match Codex internal identifiers directly.

---

# Processing Context

The Processing Context is **not** part of the protocol model. It carries execution-time state for a single request/response lifecycle.

```typescript
interface ProcessingContext {
  readonly metadata: Map<string, unknown>;
}

// ProviderCapabilities is a future extension and is not configured or used by REQ-001.
```

### Ownership Rules

| Owner | Keys | Access |
|-------|------|--------|
| Provider Adapter | Future capability metadata | Not configured or used by REQ-001 |
| Compatibility Module | Transformation state | Read/write during pipeline execution |
| Dispatcher | Lifecycle management | Create and discard |

### Design Decisions

- Processing Context is mutable: compatibility modules must share state across request/response phases.
- Provider Capabilities may be added in a future requirement; REQ-001 does not
  declare, configure, or read them.
- Future extensions (trace ID, retry state, cancellation) may add fields without changing the contract. See Issue #7.

---

# REQ-001 Scope

The following types and fields are in scope for REQ-001:

| Type | In Scope |
|------|----------|
| `InternalRequest` | ✅ Full |
| `InternalResponse` | ✅ Full |
| `InternalMessage` | ✅ Full |
| `InternalToolCall` | ✅ Full (preserved and passed through in REQ-001) |
| `InternalToolDefinition` | ✅ Full |
| `ProcessingContext` | ✅ Lifecycle management only; no cross-phase state needed for REQ-001 |

### Out of Scope for REQ-001

The following are intentionally excluded from the initial implementation:

- Image, audio, or multi-modal content in messages
- Reasoning traces
- Refusal responses
- Provider-specific extensions beyond `rawData` pass-through

---

# Error Handling

Error responses do not pass through the Internal Model in REQ-001.

When a Provider Adapter receives an error from a provider, the Dispatcher returns it to the client as-is.
Error format normalization is deferred to future requirements.

---

# Non-goals

The Internal Model does not:

- define provider-specific JSON
- define HTTP transport
- define Server-Sent Events
- define provider SDK behavior
- prescribe Metadata implementation details

These responsibilities belong to Provider Adapters.
