# Requirements

This document describes the functional requirements of AI Gateway.

Requirements are organized by priority and are intended to describe **what** the project should provide rather than **how** it is implemented.

Requirements describe observable behavior and completion criteria.

Implementation details and architectural decisions are documented in `architecture.md`.

---

# Priority

## High

### REQ-001 Compatibility Pipeline

**Status**

🚧 Planned

**Why**

Some combinations of AI clients and local LLMs expose different tool-calling formats.

For example, recent versions of Codex expect namespace-based tool names, while Qwen 3.6 running on LM Studio exposes function-based tool calls.

AI Gateway should bridge these compatibility differences so that existing MCP tools can be used without modifying prompts or backend implementations.

**Success Criteria**

- Codex can invoke Docker MCP Toolkit through LM Studio using AI Gateway.
- Namespace-based tool calls are translated into function-based tool calls.
- Function-based tool responses are translated back into namespace-based tool responses.
- Compatibility transformations are isolated from AI Provider implementations.
- Additional compatibility profiles can be introduced without changing the overall architecture.

**Notes**

Additional compatibility profiles may be added without changing the overall architecture.

### REQ-002 Multi-Provider Routing

**Status**

🚧 Planned

**Why**

Different AI workloads have different latency and compute requirements.

AI Gateway should allow explicit routing policies so that lightweight requests can be handled by smaller local models while preserving larger models for interactive conversations.

**Success Criteria**

- Chat requests can be routed to the primary AI provider.
- Auto-approval requests can be routed to the secondary AI provider.
- AI clients are unaware of the selected provider.
- Routing behavior is fully configurable through explicit routing policies.

**Notes**

Future routing policies may support additional request types.

### REQ-003 Remote MCP

**Status**

🚧 Planned

**Why**

MCP servers should be managed centrally within the local AI environment rather than being individually configured on each client machine.

This allows AI clients to access the same MCP services through AI Gateway while reducing client-side configuration.

**Success Criteria**

- AI clients can access MCP services through AI Gateway.
- Docker MCP Toolkit can be used without prompt modifications.
- Client configuration no longer requires direct MCP Server definitions.
- AI Gateway exposes a stable MCP endpoint.
- Docker MCP Toolkit can run on the gateway host.

**Notes**

Future implementations may support multiple MCP servers while preserving a single client configuration.


---

# Future Requirements

These ideas are intentionally tracked separately until they become concrete implementation requirements.

- Local Search
- RAG integration
- AI-assisted infrastructure services
- Intelligent routing
- Workflow orchestration
