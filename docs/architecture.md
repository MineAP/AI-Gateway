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
            | Compatibility Pipeline  |
            | AI Provider Adapter     |
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
- Compatibility Pipeline
- AI Provider Adapter
- LM Studio integration

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
| REQ-001 Compatibility Pipeline | ✅ In Scope | Current implementation target |
| REQ-002 Multi-Provider Routing | 🟡 Planned | Architecture considered |
| REQ-003 Remote MCP | ❌ Out of Scope | Future extension |
| REQ-004 AI Services | ❌ Out of Scope | Future extension |

### In Scope

- OpenAI-compatible HTTP API
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

The Compatibility Pipeline section additionally explains the internal request and response transformation process.

## High-Level Flow

```text
                    Request

AI Client
    │
    ▼
HTTP API Endpoint
    │
    ▼
Compatibility Pipeline
    │
    ▼
AI Provider Adapter
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
AI Provider Adapter
    │
    ▼
Compatibility Pipeline
    │
    ▼
HTTP API Endpoint
    │
    ▼
AI Client
```

The Compatibility Pipeline transforms requests before they reach the backend AI provider and transforms responses before they are returned to the client.

This bidirectional compatibility transformation allows AI Gateway to support different backend providers while exposing a stable OpenAI-compatible interface.

## Component Responsibilities

| Functional Component | Responsibility |
|----------------------|----------------|
| HTTP API Endpoint | Receives and returns OpenAI-compatible HTTP requests and responses |
| Compatibility Pipeline | Performs bidirectional compatibility transformations |
| AI Provider Adapter | Communicates with AI providers |
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
- Forward requests to the Compatibility Pipeline
- Return transformed responses to clients

### Non-responsibilities

- Compatibility transformations
- Provider-specific communication
- Routing decisions

---

## 4.2 Compatibility Pipeline

The Compatibility Pipeline provides bidirectional compatibility transformations between AI clients and backend AI providers.

It isolates model-specific compatibility differences from both clients and providers.

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

### Request Transformation

```text
Client Request
        │
        ▼
Compatibility Profile
        │
        ▼
namespace → function
        │
        ▼
Provider Request
```

### Response Transformation

```text
Provider Response
        │
        ▼
Compatibility Profile
        │
        ▼
function → namespace
        │
        ▼
Client Response
```

The request and response transformations are symmetrical.

A compatibility profile defines model-specific transformations applied during request and response processing.

Additional compatibility profiles may be introduced in the future without changing the overall architecture.

---

## 4.3 AI Provider Adapter

The AI Provider Adapter provides a unified interface for backend AI providers.

It isolates provider-specific communication from the rest of the gateway.

### Purpose

Provide a consistent interface for backend AI providers.

### Responsibilities

- Communicate with backend providers
- Convert internal requests into provider API calls
- Receive provider responses
- Handle provider-specific streaming
- Manage provider configuration

### Non-responsibilities

- Compatibility transformations
- HTTP request handling
- Routing policy decisions

Current implementation targets LM Studio.

Future implementations may support additional providers while preserving the same internal interface.

---

# 5. Configuration

AI Gateway is configured through explicit configuration rather than automatic discovery.

Each functional component owns its own configuration.

This keeps configuration aligned with functional responsibilities and allows each component to evolve independently.

| Component | Example Configuration |
|----------|-----------------------|
| HTTP API Endpoint | Listen address, port, TLS |
| Compatibility Pipeline | Compatibility profiles |
| AI Provider Adapter | Provider endpoint, authentication, timeout |
| Routing (Future) | Static routing policies |

Additional configuration items may be introduced without changing the overall architecture.

---

# 6. Architectural Extension Points

The current architecture intentionally defines clear extension points for future capabilities.

The following areas are expected to evolve independently.

| Extension Point | Future Capability |
|----------------|-------------------|
| Compatibility Pipeline | Additional compatibility profiles |
| AI Provider Adapter | Multiple AI providers |
| Backend Services | Remote MCP |
| Backend Services | Search |
| Backend Services | RAG |
| Routing | Policy-based provider selection |

These extensions should not require structural changes to the core architecture.

---

# 7. Design Decisions

The current architecture intentionally separates responsibilities between functional components.

### Compatibility Pipeline

Compatibility logic is isolated from provider communication.

This allows new compatibility profiles to be introduced without modifying provider implementations.

---

### AI Provider Adapter

Provider-specific communication is isolated from compatibility logic.

This allows additional AI providers to be supported without affecting clients.

---

### HTTP API Endpoint

HTTP communication is isolated from application logic.

This keeps API handling independent from compatibility and provider implementations.

---

# 8. Design Constraints

Future implementations should preserve the following architectural constraints.

- Maintain OpenAI API compatibility.
- Keep compatibility transformations isolated within the Compatibility Pipeline.
- Keep provider-specific communication inside AI Provider Adapters.
- Preserve clear separation of functional responsibilities.
- Prefer deterministic behavior over autonomous infrastructure decisions.
- Introduce new capabilities through extension points whenever possible.
- Keep the architecture implementation-oriented and avoid introducing unnecessary complexity.