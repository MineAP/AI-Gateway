# Roadmap

This document describes the planned implementation phases of AI Gateway.

Unlike `requirements.md`, this document focuses on **when** capabilities are expected to be introduced.

---

# Phase 1

## Gateway Framework

### Goal

Establish the gateway framework that all functional capabilities depend on.

### Deliverables

- HTTP API Endpoint
- Gateway Request Dispatcher
- Provider Registry
- Provider Adapter Interface
- Application Bootstrap

### Related Requirements

- REQ-000

---

# Phase 2

## Compatibility Pipeline

### Goal

Enable modern AI clients to communicate with local LLMs through a stable OpenAI-compatible interface.

### Deliverables

- Compatibility Pipeline
- OpenAI Adapter
- LM Studio Adapter
- Function Calling compatibility

### Related Requirements

- REQ-001

---

# Phase 3

## Multi-Provider Routing

### Goal

Support multiple AI providers through explicit routing policies.

### Deliverables

- Multiple AI Providers
- Static Routing
- Provider Configuration

### Related Requirements

- REQ-002

---

# Phase 4

## Remote AI Services

### Goal

Extend AI Gateway beyond local LLM compatibility.

### Deliverables

- Remote MCP
- Search
- RAG

### Related Requirements

- REQ-003
- REQ-004

---

# Future Evolution

Future phases will be introduced only when they provide practical value while preserving the project's design principles.
