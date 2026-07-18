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

Unsupported protocol elements SHOULD pass through unchanged.

---

# Processing Model

The Compatibility Pipeline processes both Requests and Responses.

Each Compatibility Module participates in both phases.

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

The execution order is deterministic.

Response processing corresponds to the Request that initiated the provider
interaction.

---

# Processing Context

A Processing Context represents the execution context shared by a single
Request/Response lifecycle.

It carries request-specific information that may be required during the
corresponding Response processing.

The Gateway Request Dispatcher creates and manages the Processing Context for each
Request/Response lifecycle.

Some compatibility features require information generated during Request
processing to be available during the corresponding Response processing.

Examples include:

- rewritten tool names
- namespace mappings
- provider capabilities

The Compatibility Pipeline receives the Processing Context from the Dispatcher and provides it to Compatibility
Modules as needed.

The mechanism used to preserve and propagate the Processing Context is
implementation-defined.

---

# Provider Capabilities

Compatibility Modules may use Provider Capabilities exposed through the
Processing Context.

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
- Namespace transformation
- Tool Call transformation
- Tool Result transformation

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
