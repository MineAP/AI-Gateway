# AI Gateway - Agent Instructions

Keep this file short. It is the repository entry point for AI agents. Detailed documentation lives under `docs/`.

## Read First

Read the following documents before making architectural or implementation changes.

1. README.md
2. docs/architecture.md
3. docs/requirements.md
4. docs/roadmap.md
5. docs/development.md
6. docs/design/README.md

The Development Guide defines how code should be organized and implemented within this repository. Read it before implementing code.

## Documentation

### General

Keep long-term project documentation under `docs/`.

Only promote content to `architecture.md` after the design has been finalized.

When responsibilities, architecture, or requirements change, update the corresponding documentation.

### Design Documents

Architecture and implementation design documents are organized under `docs/design/`.

Read the relevant design documents before modifying architecture or implementing major features.

Use `docs/design-notes/` for implementation studies, technology evaluations, and temporary design discussions.

### Testing

Testing resources are organized under `test/`.

Read `test/fixtures/README.md` before adding or modifying protocol fixtures.

## Architecture

Follow the responsibilities defined in `docs/architecture.md`.

Maintain clear separation between the following functional components:

- HTTP API Endpoint
- Gateway Request Dispatcher
- Provider Registry
- Compatibility Pipeline
- Provider Adapter

Avoid mixing responsibilities across components.

## Sequence Diagrams

Use Mermaid sequence diagrams for request flow and component interaction documentation.
Avoid ASCII diagrams for execution flows — prefer Mermaid `sequenceDiagram` syntax.

## Design Principles

Prefer the smallest implementation that satisfies the current requirement.

Avoid implementing future capabilities before they become concrete requirements.

Keep implementations simple, explicit, and predictable.

## Future Requirements

Items listed under **Future Requirements** are design ideas.

Do not implement them until they are promoted into concrete requirements.

## Local Files

Store temporary notes, experiments, investigation reports, and working files under `.local/`.

Do not commit files under `.local/`.