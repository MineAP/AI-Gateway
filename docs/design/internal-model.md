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
| Metadata | Context shared between Request and Response processing |

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
- Request processing may generate Metadata that is reused during the corresponding Response processing.

---

# Design Principles

## 1. Provider Independence

The Compatibility Pipeline must not depend on provider-specific JSON.

Instead, it operates only on the Internal Model.

---

## 2. Raw Data Preservation

The Internal Model contains:

- normalized fields used by compatibility modules
- original provider payload (Raw Data)

This allows unsupported protocol elements to pass through unchanged.

---

## 3. Request / Response Context

Some compatibility features require information generated during Request
processing to be available during Response processing.

The Request pipeline may therefore generate Metadata.

The corresponding Response pipeline receives this Metadata through the same
processing context.

The mechanism used to propagate Metadata is intentionally unspecified by this
document.

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

# Internal Model

The Internal Model consists of:

- normalized fields used by compatibility modules
- preserved Raw Data
- Metadata shared between Request and Response processing

Only normalized fields are modified by compatibility modules.

Raw Data exists solely to preserve provider-specific information that is outside
the scope of the current compatibility implementation.

---

# Non-goals

The Internal Model does not:

- define provider-specific JSON
- define HTTP transport
- define Server-Sent Events
- define provider SDK behavior
- prescribe Metadata implementation details

These responsibilities belong to Provider Adapters.