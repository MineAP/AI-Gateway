# Architecture

This document describes the **logical architecture** of AI Gateway.

Unlike the project roadmap, this document focuses on how the current implementation is organized rather than how the project may evolve in the future.

The architecture intentionally reflects the current implementation and development phase.

Future capabilities are documented separately in `requirements.md` and `roadmap.md`.

The architecture favors explicit responsibilities, deterministic behavior, and clear separation of functional responsibilities.

---

# 1. Overview

AI Gateway provides an OpenAI-compatible interface between modern AI clients and local AI environments.

The current implementation focuses on compatibility between AI clients and local LLM environments while keeping the architecture simple, modular, and extensible.

```text
                    AI Client
              (Codex, ChatGPT, etc.)
                        │
              OpenAI-compatible API
                        │
            +-------------------------+
            |       AI Gateway        |
            |-------------------------|
            | HTTP API Endpoint       |
            | Gateway Request Dispatcher |
            | Provider Registry         |
            | Compatibility Pipeline    |
            | Provider Adapter          |
            +-------------------------+
                        │
                        ▼
                Local AI Environment
                  ├── AI Provider
                  │      ├── LM Studio
                  │      │      └── Local LLM
                  │      │
                  │      └── Future Providers
                  │
                  ├── MCP Server (Future)
                  ├── Search Service (Future)
                  └── RAG (Future)
```

Current implementation includes:

- OpenAI-compatible HTTP API
- Gateway Request Dispatcher
- Provider Registry
- Compatibility Pipeline
- Provider Adapters
  - OpenAI Adapter
  - LM Studio Adapter

The following capabilities are intentionally deferred to future development phases:

- Remote MCP
- Search services
- RAG
- AI-assisted infrastructure services

---

# 2. Scope

This document describes only the architecture required for the current implementation.

Future capabilities are intentionally excluded to keep the design focused on the current development phase.

| Requirement | Status | Notes |
|-------------|:------:|------|
| REQ-000 Gateway Framework        | ✅ In Scope | Current implementation target |
| REQ-001 Compatibility Pipeline | ✅ In Scope | Current implementation target |
| REQ-002 Multi-Provider Routing | 🟡 Planned | Architecture considered |
| REQ-003 Remote MCP | ❌ Out of Scope | Future extension |
| REQ-004 AI Services | ❌ Out of Scope | Future extension |

### In Scope

- OpenAI-compatible HTTP API
- Request orchestration via Gateway Request Dispatcher
- Provider adapter resolution via Provider Registry
- Compatibility transformations
- AI provider abstraction
- Local LLM integration

### Out of Scope

- Remote MCP execution
- Search services
- RAG
- AI-assisted routing
- Workflow orchestration

---

# 3. System Flow

The following sections describe each functional component and its responsibilities in detail.
For a detailed description of the request lifecycle, sequence diagrams, and Processing Context behavior, see `docs/design/request-flow.md`.

## High-Level Flow

```text
                    Request

AI Client
    │
    ▼
HTTP API Endpoint
    │
    ▼
Gateway Request Dispatcher
    │
    ├──→ Provider Registry (resolve inbound adapter)
    │
    ▼
Provider Adapter (OpenAI) — parseRequest
    │
    ▼
Compatibility Pipeline
    │
    ▼
Provider Adapter (LM Studio) — buildRequest
    │
    ▼
AI Provider
    │
    ▼
Local LLM


                    Response

Local LLM
    │
    ▼
AI Provider
    │
    ▼
Provider Adapter (LM Studio) — parseResponse
    │
    ▼
Compatibility Pipeline
    │
    ▼
Provider Adapter (OpenAI) — buildResponse
    │
    ▼
Gateway Request Dispatcher
    │
    ▼
HTTP API Endpoint
    │
    ▼
AI Client
```

The Gateway Request Dispatcher orchestrates the entire request lifecycle: resolving adapters through the Provider Registry, invoking compatibility transformations via the Compatibility Pipeline, and coordinating request/response flow.

This architecture allows AI Gateway to support different backend providers while exposing a stable OpenAI-compatible interface.

## Component Responsibilities

| Functional Component | Responsibility |
|----------------------|----------------|
| HTTP API Endpoint | Receives and returns OpenAI-compatible HTTP requests and responses |
| Gateway Request Dispatcher | Orchestrates request execution, resolves adapters, invokes the Compatibility Pipeline, and manages the request lifecycle |
| Provider Registry | Registers and resolves available Provider Adapters by provider name |
| Compatibility Pipeline | Performs bidirectional compatibility transformations on the Gateway Internal Model |
| Provider Adapter | Converts between Gateway Internal Model and provider-specific protocols |
| AI Provider | Executes inference using the configured backend model |

Detailed request and response transformations are described in the Compatibility Pipeline section.

---

# 4. Functional Components

## 4.1 HTTP API Endpoint

The HTTP API Endpoint exposes an OpenAI-compatible API to AI clients.

It is responsible only for HTTP communication and request lifecycle management.

### Purpose

Provide a stable OpenAI-compatible HTTP interface.

### Responsibilities

- Receive OpenAI-compatible HTTP requests
- Validate request format
- Handle streaming responses
- Forward requests to the Gateway Request Dispatcher
- Return transformed responses to clients

### Non-responsibilities

- Compatibility transformations
- Provider-specific communication
- Routing decisions
- Adapter resolution

---

## 4.2 Gateway Request Dispatcher

The Gateway Request Dispatcher orchestrates the entire request lifecycle within AI Gateway.

It coordinates adapter resolution, compatibility processing, and provider communication.

### Purpose

Provide centralized orchestration for all request and response processing.

### Responsibilities

- Resolve adapters through the Provider Registry
- Invoke `parseRequest()` on the inbound adapter to convert client requests into the Gateway Internal Model
- Execute the Compatibility Pipeline on both requests and responses
- Invoke `buildRequest()` on the outbound adapter to convert the internal model into a provider-specific request
- Communicate with backend providers
- Invoke `parseResponse()` on the outbound adapter to convert provider responses into the Gateway Internal Model
- Invoke `buildResponse()` on the inbound adapter to convert the internal model back into client-compatible format
- Manage the Processing Context lifecycle for streaming responses

### Non-responsibilities

- HTTP communication
- Compatibility transformation logic
- Provider-specific protocol details
- Adapter registration

---

## 4.3 Provider Registry

The Provider Registry manages available Provider Adapters and resolves them by provider name.

In REQ-001, the registry uses a fixed adapter configuration. Future implementations may support dynamic resolution strategies.

### Purpose

Provide a centralized mechanism for resolving Provider Adapters.

### Responsibilities

- Register available Provider Adapters
- Resolve adapters by provider identifier
- Maintain adapter availability state

### Non-responsibilities

- Request orchestration
- Compatibility transformations
- Provider communication
- Routing policy decisions

---

## 4.4 Compatibility Pipeline

The Compatibility Pipeline provides bidirectional compatibility transformations between AI clients and backend AI providers.

It operates exclusively on the Gateway Internal Model, isolating model-specific compatibility differences from both clients and providers.

### Purpose

Provide a stable compatibility layer between AI clients and backend providers.

### Responsibilities

- Transform client requests before provider execution
- Transform provider responses before returning them to clients
- Apply compatibility profiles
- Hide backend-specific API differences
- Maintain OpenAI-compatible behavior

### Non-responsibilities

- HTTP communication
- Provider-specific API calls
- Model execution
- Adapter resolution
- Request orchestration

### Request Transformation

```text
Client Request (via inbound adapter)
        │
        ▼
Gateway Internal Model
        │
        ▼
Compatibility Profile
        │
        ▼
namespace → function
        │
        ▼
Gateway Internal Model (transformed)
        │
        ▼
Provider Request (via outbound adapter)
```

### Response Transformation

```text
Provider Response (via outbound adapter)
        │
        ▼
Gateway Internal Model
        │
        ▼
Compatibility Profile
        │
        ▼
function → namespace
        │
        ▼
Gateway Internal Model (transformed)
        │
        ▼
Client Response (via inbound adapter)
```

The request and response transformations are symmetrical.

A compatibility profile defines model-specific transformations applied during request and response processing.

Additional compatibility profiles may be introduced in the future without changing the overall architecture.

---

## 4.5 Provider Adapter

Provider Adapters convert between provider-specific protocols and the Gateway Internal Model.

Each adapter implements a standardized interface with four methods:

- `parseRequest()` — Convert a provider-specific request into the Gateway Internal Model
- `buildRequest()` — Convert the Gateway Internal Model into a provider-specific request
- `parseResponse()` — Convert a provider-specific response into the Gateway Internal Model
- `buildResponse()` — Convert the Gateway Internal Model into a provider-specific response

Provider Adapters are responsible for protocol conversion only. Communication with backend providers is orchestrated by the Gateway Request Dispatcher.

### Purpose

Provide bidirectional protocol conversion between provider protocols and the Gateway Internal Model.

### Responsibilities

- Parse incoming provider requests into the Gateway Internal Model
- Build outgoing provider requests from the Gateway Internal Model
- Parse incoming provider responses into the Gateway Internal Model
- Build outgoing client responses from the Gateway Internal Model
- Expose Provider Capabilities for compatibility decisions

### Non-responsibilities

- Compatibility transformations
- HTTP request handling
- Routing policy decisions
- Request orchestration

Current implementation targets:

- **OpenAI Adapter** — Converts between OpenAI protocol and the Gateway Internal Model
- **LM Studio Adapter** — Converts between LM Studio protocol and the Gateway Internal Model

Future implementations may support additional providers while preserving the same adapter interface.

---

# 5. Configuration

AI Gateway is configured through explicit configuration rather than automatic discovery.

Each functional component owns its own configuration.

This keeps configuration aligned with functional responsibilities and allows each component to evolve independently.

| Component | Example Configuration |
|----------|-----------------------|
| HTTP API Endpoint | Listen address, port, TLS |
| Gateway Request Dispatcher | Provider selection policy |
| Provider Registry | Registered adapters and their identifiers |
| Compatibility Pipeline | Compatibility profiles |
| Provider Adapter | Provider endpoint, authentication, timeout |

Additional configuration items may be introduced without changing the overall architecture.

---

# 6. Architectural Extension Points

The current architecture intentionally defines clear extension points for future capabilities.

The following areas are expected to evolve independently.

| Extension Point | Future Capability |
|----------------|-------------------|
| Adapter Resolution | Dynamic adapter selection, rule-based routing, request attribute routing |
| Compatibility Pipeline | Additional compatibility profiles |
| Provider Adapters | New AI provider adapters |
| Backend Services | Remote MCP |
| Backend Services | Search |
| Backend Services | RAG |

These extensions should not require structural changes to the core architecture.

### Adapter Resolution

REQ-001 uses a fixed adapter configuration where inbound and outbound adapters are determined by static configuration.

Future implementations may support:

- Rule-based routing policies
- Configuration-driven provider selection
- Request attribute-based adapter resolution

The Provider Registry is designed to accommodate these extensions without architectural changes.

---

# 7. Design Decisions

The current architecture intentionally separates responsibilities between functional components.

### Gateway Request Dispatcher

Request orchestration is centralized in the Dispatcher rather than distributed across components.

This ensures a single, predictable execution path for all requests and simplifies lifecycle management — particularly for streaming responses where Processing Context must be shared across chunks.

---

### Provider Registry

Adapter resolution is isolated from request orchestration.

The Registry handles adapter registration and lookup, while the Dispatcher coordinates their invocation. This separation allows future routing strategies to evolve without affecting orchestration logic.

REQ-001 uses a fixed configuration. Future implementations may introduce dynamic resolution strategies.

---

### Compatibility Pipeline

Compatibility logic is isolated from provider communication and request orchestration.

This allows new compatibility profiles to be introduced without modifying adapter implementations or dispatcher behavior.

The Dispatcher invokes the pipeline, but transformation logic remains entirely within the Compatibility Pipeline.

---

### Provider Adapter

Provider-specific protocol conversion is isolated from both compatibility logic and request orchestration.

Each adapter implements a standardized four-method interface (`parseRequest`, `buildRequest`, `parseResponse`, `buildResponse`), allowing new providers to be added without affecting other components.

Adapters are responsible for protocol conversion only — communication with backend providers is orchestrated by the Dispatcher.

---

### HTTP API Endpoint

HTTP communication is isolated from application logic.

This keeps API handling independent from orchestration, compatibility, and provider implementations.

---

# 8. Design Constraints

Future implementations should preserve the following architectural constraints.

- Maintain OpenAI API compatibility.
- Keep compatibility transformations isolated within the Compatibility Pipeline.
- Keep provider-specific protocol conversion inside Provider Adapters.
- Preserve clear separation of functional responsibilities between Dispatcher, Registry, Pipeline, and Adapters.
- Prefer deterministic behavior over autonomous infrastructure decisions.
- Introduce new capabilities through extension points whenever possible.
- Keep the architecture implementation-oriented and avoid introducing unnecessary complexity.
