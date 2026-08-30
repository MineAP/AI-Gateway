# Compatibility Pipeline

> The Compatibility Pipeline defines the execution model for all compatibility
> processing performed inside AI Gateway.

The Compatibility Pipeline transforms the Gateway Internal Model to bridge
compatibility gaps between AI clients and AI providers.

Compatibility Modules operate exclusively on the Gateway Internal Model.

Provider-specific protocols remain the responsibility of Provider Adapters.

See also: [request-flow.md](request-flow.md) for the end-to-end request lifecycle and component responsibilities.

---

# Purpose

The Compatibility Pipeline isolates compatibility logic from protocol
conversion.

Each compatibility feature is implemented as an independent Compatibility
Module.

The initial implementation (REQ-001) focuses on Function Calling compatibility
while allowing future compatibility modules to be added without changing the
overall architecture.

---

# Glossary

| Term | Description |
|------|-------------|
| **Compatibility Pipeline** | Executes Compatibility Modules during Request and Response processing. Defines the execution model for compatibility processing inside AI Gateway. |
| **Compatibility Module** | Performs one specific compatibility transformation on the Gateway Internal Model. |
| **Processing Context** | Execution context shared by a single Request/Response lifecycle. |
| **Provider Capability** | Provider features exposed by a Provider Adapter for compatibility decisions. |

---

# Relationship to the Internal Model

```text
                AI Client
                     │
             HTTP Request
                     │
                     ▼

            Provider Adapter
                     │
                     ▼

          Gateway Internal Model
                     │
                     ▼

      Compatibility Pipeline
      ┌──────────────────────────────┐
      │ Function Calling Module      │
      │ Future Compatibility Modules │
      └──────────────────────────────┘
                     │
                     ▼

          Gateway Internal Model
                     │
                     ▼

            Provider Adapter
                     │
                     ▼

               AI Provider



               AI Provider
                     │
             HTTP Response
                     ▼

            Provider Adapter
                     │
                     ▼

          Gateway Internal Model
                     │
                     ▼

      Compatibility Pipeline
      ┌──────────────────────────────┐
      │ Function Calling Module      │
      │ Future Compatibility Modules │
      └──────────────────────────────┘
                     │
                     ▼

          Gateway Internal Model
                     │
                     ▼

            Provider Adapter
                     │
                     ▼

                AI Client
```

The Compatibility Pipeline never accesses provider-specific protocols directly.

The Compatibility Pipeline is invoked by the Gateway Request Dispatcher.
Adapter protocol conversion and pipeline execution are orchestrated by the
Dispatcher — neither the HTTP Layer nor Provider Adapters invoke the Pipeline directly.

---

# Design Principles

## Internal Model Only

Compatibility Modules MUST operate only on the Gateway Internal Model.

Modules SHOULD NOT access provider-specific JSON whenever normalized
information is available.

---

## Independent Modules

Each compatibility feature SHOULD be implemented as an independent
Compatibility Module.

Modules SHOULD NOT depend on the existence or ordering of other modules.

---

## Deterministic Processing

Compatibility Modules execute in a deterministic order.

The ordering mechanism is intentionally implementation-defined.

---

## Stateless Transformations

Compatibility Modules SHOULD behave as stateless transformations whenever
practical.

Request-specific Processing Context is managed by the Compatibility Pipeline.

---

## Preserve Provider Data

Compatibility Modules SHOULD preserve provider-specific information whenever
possible.

Unsupported protocol elements are preserved in the `rawData` field of each
Internal Model type and SHOULD pass through unchanged.

---

# Processing Model

The Compatibility Pipeline supports both Request and Response phases. A module
may implement one or both phases. The REQ-001 Function Calling Module
transforms only the Request; its Response phase is pass-through.

```text
Request

Internal Request
        │
        ▼

Compatibility Pipeline

        │
        ▼

Module A

        │
        ▼

Module B

        │
        ▼

Internal Request

        │
        ▼

Provider Adapter

==========================================

Provider Adapter

        │
        ▼

Internal Response

        │
        ▼

Compatibility Pipeline

        │
        ▼

Module B

        │
        ▼

Module A

        │
        ▼

Internal Response

Response
```

The execution order is deterministic. REQ-001 contains only one module, so no
module ordering policy is required at this stage.

Response processing corresponds to the Request that initiated the provider
interaction.

For streaming responses, future stateful Compatibility Modules may process each
chunk independently as a `StreamChunk` while sharing a single Processing
Context for the duration of the stream. REQ-001 does not maintain response
processing state because its response phase is pass-through.

---


# Function Calling Module

The Function Calling Module is the first Compatibility Module implemented for REQ-001.

## Responsibility

Transforms namespaced tool definitions into flat representations so that
providers which do not support namespace structures can correctly process
function calling requests.

## Request Processing: Namespace → Flat

When the AI Client sends a request containing `type: "namespace"` tool definitions,
the Function Calling Module flattens them into individual function tools before
forwarding to the Provider Adapter.

### Transformation Logic

For each namespace entry in `GatewayRequest.tools[]`:

1. Extract the inner `tools[]` array from the namespace object.
2. For each inner tool, create a standalone `FunctionToolDefinition` with `type: "function"`.
3. Set the flattened tool name to `<namespace_name>__<tool_name>` (e.g., `mcp__MCP_DOCKER__browser_click`). This naming convention matches Codex CLI internal identifiers.
4. Replace the original namespace entry with the flattened function definitions.

### Example

```text
Input (from AI Client):
  { type: "namespace", name: "mcp__MCP_DOCKER", tools: [
    { type: "function", name: "browser_click" },
    { type: "function", name: "browser_close" }
  ]}

Output (to Provider Adapter):
  { type: "function", name: "mcp__MCP_DOCKER__browser_click", ... }
  { type: "function", name: "mcp__MCP_DOCKER__browser_close", ... }
```

## Response Processing: Pass-through

The REQ-001 Function Calling Module does not transform responses. Provider
responses, including tool calls and tool results, are passed through unchanged
after provider protocol parsing and before client protocol serialization.

## Processing Context Usage

The Function Calling Module does not store state in the Processing Context.
Request-side flattening produces flat names that are self-contained; no reverse
mapping is required for response processing.


# Processing Context

A Processing Context represents the execution context shared by a single
Request/Response lifecycle.

It carries request-specific information that may be required during the
corresponding Response processing.

The Gateway Request Dispatcher creates and manages the Processing Context for each
Request/Response lifecycle.

Some compatibility features require information generated during Request
processing to be available during the corresponding Response processing.

Future examples include:

- `rewritten tool names`
- `namespace mappings`

The Compatibility Pipeline receives the Processing Context from the Dispatcher and provides it to Compatibility
Modules as needed.

The specific type definition, ownership rules, and lifecycle management are
documented in [internal-model.md](internal-model.md). See that document for:

- `ProcessingContext` interface and field definitions
- Ownership rules (Adapter vs Module vs Dispatcher)

---

# Provider Capabilities (Future)

Future Compatibility Modules may use Provider Capabilities exposed through the
Processing Context.

REQ-001 does not configure, expose, or use Provider Capabilities. Its namespace
flattening is applied uniformly.

Modules SHOULD rely on capabilities rather than provider-specific
implementations whenever practical.

Examples include:

- namespace tool support
- tool search support
- future provider capabilities

Determining Provider Capabilities is the responsibility of the Provider Adapter.

---

# Compatibility Modules

A Compatibility Module transforms one specific aspect of the Gateway Internal
Model.

Examples include:

| Module | Purpose |
|---------|---------|
| Function Calling | Function Calling compatibility |
| Streaming | Future |
| Capability Normalization | Future |
| Provider Extensions | Future |

A Compatibility Module:

- processes Requests
- processes Responses
- operates only on the Gateway Internal Model
- should remain independent of other modules

---

# Error Handling

Compatibility Modules SHOULD report transformation failures using Gateway-defined
errors.

Provider communication and transport errors remain the responsibility of
Provider Adapters.

---

# REQ-001 Scope

REQ-001 implements the first Compatibility Module.

### Included

- Function Calling compatibility
- Structural transformation: namespace → flat in `processRequest()` using `<namespace>__<tool>` naming convention
- Response pass-through; no response compatibility transformation is performed

### Pass-through

- Reasoning
- Streaming events
- Provider-specific extensions

### Out of Scope

- MCP
- RAG
- Multi-provider routing

---

# Non-goals

The Compatibility Pipeline does not:

- parse provider protocols
- perform HTTP communication
- perform provider routing
- invoke external services

These responsibilities belong to other Gateway components.

---

# Future Evolution

Future Compatibility Modules should be introduced without modifying existing
Provider Adapters or the Gateway Internal Model.

The Compatibility Pipeline should remain extensible while preserving
deterministic behavior and compatibility between AI clients and AI providers.
