# AI Gateway

> **A predictable OpenAI-compatible gateway for making the most of your local AI infrastructure.**

AI Gateway is a lightweight OpenAI-compatible gateway designed to improve interoperability between modern AI clients and local AI environments.

Its initial focus is enabling AI clients such as Codex to work seamlessly with local LLMs while hiding model-specific compatibility differences behind a stable and predictable interface.

Rather than relying on autonomous infrastructure decisions, AI Gateway is built around explicit compatibility rules, deterministic routing, and transparent integrations, allowing users to remain in control of how their AI environment behaves.

---

# Motivation

Modern AI software evolves rapidly, while local hardware typically evolves over much longer replacement cycles.

Many developers already own capable but heterogeneous AI resources:

- Desktop GPUs
- Home servers
- Laptops
- Local LLMs
- MCP servers
- Search services

Connecting these resources into a consistent AI environment often requires model-specific workarounds, duplicated configurations, and manual integration.

AI Gateway aims to unify existing local AI infrastructure behind a predictable OpenAI-compatible interface, allowing modern AI clients to make better use of local resources.

Rather than assuming increasingly powerful hardware, the project focuses on making efficient use of limited local compute resources while getting the most value from the infrastructure you already have.

---

# Current Status

Current focus:

- 🚧 Compatibility Pipeline
- ⏳ Multi-Provider Routing
- ⏳ Remote MCP
- ⏳ AI Services

See **docs/roadmap.md** for implementation phases.

---

# Design Principles

## Keep Models Simple

LLMs should interact only with stable Function Calling APIs.

Backend implementations should be free to evolve without requiring prompt changes or model-specific instructions.

---

## Backend Independence

Gateway APIs remain stable regardless of backend implementation.

For example, a function such as

```text
search_documentation()
```

may internally use:

- Docker MCP Toolkit
- Local Search
- Future RAG implementation

without requiring changes to prompts or client behavior.

---

## Predictable by Design

AI Gateway favors explicit configuration over autonomous infrastructure decisions.

Compatibility transformations, routing policies, and backend integrations are defined by deterministic rules rather than AI-generated decisions.

The goal of AI Gateway is not to replace AI reasoning, but to provide infrastructure that allows AI systems to use local resources more effectively.

Predictability is not only a usability goal—it is also an efficiency strategy for resource-constrained local AI environments.

---

## Small Start

AI Gateway evolves incrementally.

Each implementation phase focuses on solving a concrete problem using the smallest useful architecture before introducing additional capabilities.

Features such as Remote MCP, RAG, workflow automation, and intelligent routing will be introduced only when they provide clear practical value.

---

## Docker-first

Each component should be independently deployable as a Docker container.

This enables consistent deployment across desktops, home servers, and future environments while keeping the overall architecture modular.

---

# High-Level Architecture

AI Gateway currently focuses on providing a lightweight compatibility layer between modern AI clients and local AI environments.

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

The first implementation focuses on compatibility between AI clients and local LLMs.

Additional backend services will be introduced incrementally while preserving a stable OpenAI-compatible interface.

Architecture details are documented in **docs/architecture.md**.

---

# Future Evolution

AI Gateway is intentionally designed to evolve incrementally.

Future capabilities will be introduced only after they solve concrete problems while preserving the project's core principles:

- Predictable behavior
- Explicit configuration
- Backend independence
- Efficient use of local AI resources

Potential future directions include:

- Additional LLM compatibility layers
- Multiple AI providers
- Remote MCP integration
- Local Search
- RAG
- AI-assisted infrastructure services

---

# Why Deterministic Routing?

AI-driven infrastructure decisions are not free.

When AI selects an inappropriate backend or workflow, the result is often a failed request followed by one or more retries.

In cloud environments this may simply increase operating costs.

In local AI environments, however, retries consume valuable GPU time, memory bandwidth, and power while reducing the responsiveness of interactive workloads.

AI Gateway therefore favors deterministic, rule-based routing whenever possible, reserving AI reasoning for problems that genuinely require it.

Autonomous routing may be introduced in the future when its practical benefits clearly outweigh its computational cost.

---

# Documentation

Project documentation is organized by responsibility.

Design documents under `docs/design/` define the internal architecture,

design principles, and internal contracts used by AI Gateway.

| Document | Purpose |
|----------|---------|
| **README.md** | Project overview and design philosophy |
| **docs/requirements.md** | Functional requirements |
| **docs/roadmap.md** | Implementation roadmap |
| **docs/architecture.md** | Current system architecture |
| **docs/development.md** | Development Guide |
| **docs/design/** | Internal design documents, design principles, and internal contracts |

The architecture document always describes the current implementation.

Future ideas and planned capabilities are intentionally documented separately.

---

# License

MIT License