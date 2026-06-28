# AI Gateway - Agent Instructions

Keep this file short. It is the repository entry point for AI agents. Detailed documentation lives under `docs/`.

## Read First

Read the following documents before making architectural or implementation changes.

1. `README.md`
2. `docs/architecture.md`
3. `docs/requirements.md`
4. `docs/roadmap.md`

## Documentation

Keep long-term project documentation under `docs/`.

Use `docs/design-notes/` for implementation studies, technology evaluations, and temporary design discussions.

Only promote content to `architecture.md` after the design has been finalized.

When responsibilities, architecture, or requirements change, update the corresponding documentation.

## Architecture

Follow the responsibilities defined in `docs/architecture.md`.

Maintain clear separation between the following functional components:

- HTTP API Endpoint
- Compatibility Pipeline
- AI Provider Adapter

Avoid mixing responsibilities across components.

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