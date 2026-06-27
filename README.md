# AI Gateway

A lightweight AI Gateway for local LLM environments.

AI Gateway provides a unified Function Calling interface for local language models while hiding implementation details such as MCP servers, REST APIs, RAG systems, and documentation search.

The goal is to make local LLMs behave more like cloud-hosted AI assistants without requiring native support for OpenAI's latest Responses API features.

---

# Motivation

Modern AI tools increasingly rely on advanced Function Calling features such as OpenAI Responses API namespaces.

Cloud models (GPT-5.x) support these features natively because the model, API, and client are designed together.

Many local LLMs, however, currently have limited compatibility with namespace-based tool calling.

Instead of exposing complex tool schemas directly to the model, AI Gateway presents a small set of stable Function Calling APIs.

Example:

Instead of exposing

```
mcp__MCP_DOCKER.search_documentation(...)
```

the model only sees

```
search_documentation(...)
```

AI Gateway routes the request to the appropriate backend.

---

# Features

* OpenAI-compatible Function Calling interface
* MCP integration
* Documentation search
* Web search
* Local RAG
* Tool routing
* Authentication
* Result caching
* Multiple backend support

---

# High Level Architecture

```
                Local LLM
                     │
             Function Calling
                     │
          +----------------------+
          |      AI Gateway      |
          +----------------------+
          │ Tool Registry
          │ Router
          │ Cache
          │ Authentication
          │ Logging
          └───────┬──────────────
                  │
      ┌───────────┼──────────────┐
      │           │              │
      ▼           ▼              ▼
  MCP Servers   REST APIs     Local Services
```

---

# Design Goals

* Simple tool schemas
* Local LLM compatibility
* Backend independence
* Extensible adapter architecture
* Docker-first deployment
* Stateless gateway where possible

---

# Planned Integrations

## MCP

* Docker MCP
* GitHub MCP
* Filesystem MCP
* Playwright MCP

## Search

* Documentation search
* Web search
* Repository search

## AI

* Embedding models
* Reranker
* Local RAG

---

# Future

AI Gateway is intended to become the central AI platform for a personal homelab.

It should support multiple LLMs, multiple search providers, multiple MCP servers, and future AI workflows through a single stable Function Calling interface.
