# Development Guide

## 1. Development Environment

### Runtime
- Node.js 24 LTS

### Language
- TypeScript (latest stable)

### Module System
- ECMAScript Modules (ESM)
- "type": "module"

### Package Manager
- pnpm

### Development Tools

The following tools are used throughout the project.

| Tool | Purpose |
|------|---------|
| Biome | Formatting and linting |
| Vitest | Unit testing |

## 2. Repository Layout

The repository is organized to keep executable applications, reusable libraries, and project documentation clearly separated.

### Overview
```
ai-gateway/
├── apps/
│   └── gateway/
│       ├── src/
│       │   ├── app.ts
│       │   ├── server.ts
│       │   ├── routes/
│       │   └── index.ts
│       └── package.json
│
├── packages/
│   ├── compatibility/
│   ├── provider/
│   ├── protocol/
│   ├── config/
│   └── shared/
│
├── test/
├── docs/
│
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── biome.json
```

### apps/

Executable applications.

- Contains runnable applications.
- Composes packages into a working service.
- Should contain minimal business logic.

### packages/

Reusable libraries shared across applications.

| Package | Responsibility |
|---------|----------------|
| compatibility | Compatibility Pipeline |
| provider | AI Provider Adapter |
| protocol | Internal data model |
| config | Configuration loading |
| shared | Shared utilities |

Each package owns a single responsibility and should remain independently testable.

New functionality should be added to an existing package only if it matches that package’s responsibility; otherwise, create a new package.

### docs/

Project documentation.

Architecture, requirements, roadmap, and development guides.

### test/

Repository-level integration tests and shared test assets.

### Root Files

| File | Purpose |
|------|---------|
| package.json | Workspace configuration |
| pnpm-workspace.yaml | Workspace definition |
| tsconfig.base.json | Shared TypeScript configuration |
| biome.json | Shared formatter/linter configuration |


## 3. Package Responsibilities

Each package owns a single responsibility.

Packages should remain focused on their defined responsibility and should not depend on implementation details of other packages.

### compatibility

Provides the Compatibility Pipeline.

#### Responsibilities

- Transform client requests into provider requests.
- Transform provider responses into client responses.
- Apply compatibility profiles.
- Preserve OpenAI-compatible behavior.

#### Non-responsibilities

- HTTP communication
- Provider-specific API calls
- Model execution

### provider

Provides a unified interface for backend AI providers.

#### Responsibilities

- Communicate with AI providers.
- Convert internal requests into provider-specific requests.
- Handle provider-specific streaming.
- Manage provider configuration.

#### Non-responsibilities

- Compatibility transformations
- HTTP request handling

### protocol

Defines the internal data model shared across packages.

Other packages should communicate through the types defined in this package whenever possible.

#### Responsibilities

- Define internal request and response models.
- Define shared interfaces between packages.
- Remain independent of any external AI provider.

#### Non-responsibilities

- Request transformation
- Provider communication
- Configuration loading

### config

Provides configuration loading and validation.

#### Responsibilities

- Load configuration files.
- Validate configuration.
- Provide typed configuration objects.

#### Non-responsibilities

- Runtime behavior
- Compatibility transformations

### shared

Provides reusable utilities shared across packages.

#### Responsibilities

- Shared utility functions
- Common error types
- Generic helper modules

#### Non-responsibilities

- Business logic
- Compatibility logic
- Provider-specific code

### Adding a New Package

Create a new package only when:

- The functionality has a clearly defined responsibility.
- The functionality can be tested independently.
- The functionality is expected to evolve independently.

Do not create packages solely for organizational purposes.

## 4. Dependency Rules

### Dependency Graph

```
                apps
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
compatibility  provider   config
        │         │
        └────┬────┘
             ▼
         protocol
             ▼
          shared
```

### Dependency Principles

Dependencies shall always point toward lower-level packages.

Dependency cycles are not allowed.

Packages communicate through protocol whenever possible.

Packages should depend on abstractions rather than implementations.

### Allowed Dependencies

apps
```
apps → compatibility
apps → provider
apps → config
apps → protocol
```

compatibility
```
compatibility → protocol
compatibility → shared
```

provider
```
provider → protocol
provider → shared
```

config
```
config → shared
```

protocol
```
protocol → shared
```

### Prohibited Dependencies

- provider → compatibility
- compatibility → provider
- protocol → compatibility
- protocol → provider
- shared → any package

## 5. TypeScript Guidelines

The following guidelines define how TypeScript should be used throughout the AI Gateway project.

Formatting and style are enforced by tooling (Biome) and are intentionally excluded from this document.

### Compiler

- Enable `strict` mode.
- Use `NodeNext` module resolution.
- Do not disable compiler checks to suppress errors.

### Imports

- Use ECMAScript module imports.
- Prefer `import type` for type-only imports.
- Use package imports instead of deep relative imports whenever possible.
- Do not import another package's internal implementation files.

### Exports

- Export only public APIs from `index.ts`.
- Keep internal implementation files private to their package.

### Package Boundaries

- Communicate between packages using types defined in `@ai-gateway/protocol` whenever possible.
- Do not expose provider-specific types outside the `provider` package.
- Do not expose compatibility-specific types outside the `compatibility` package.

### Async Programming

- Prefer `async` / `await` over chained Promises.
- Avoid unhandled promises.
- Prefer explicit error propagation over silent failures.

### Error Handling

- Throw `Error` subclasses rather than primitive values.
- Use exceptions only for exceptional situations.
- Avoid using exceptions for normal control flow.

### External APIs

- Isolate external API models within their corresponding packages.
- Convert external models into internal protocol models at package boundaries.


## 6. Testing

### Testing Principles

- Every new feature should include appropriate tests.
- Tests should verify observable behavior rather than implementation details.
- Tests should remain deterministic and independent.
- Keep tests simple, readable, and maintainable.
- Compatibility profiles should be tested using representative request and response pairs.
- Each test should verify a single behavior.

### Test Types

#### Unit Tests

Verify the behavior of an individual package in isolation from external dependencies.

#### Integration Tests

Verify interactions between multiple packages and external AI providers.

### Test Organization

- Unit tests should be colocated with the package under test.
- Repository-level integration tests belong under `test/`.

example:
```
packages/
├── compatibility/
│   ├── src/
│   └── test/
│
├── provider/
│   ├── src/
│   └── test/
│
test/
└── integration/
```

### Test Fixtures

- Prefer reusable fixtures for compatibility transformations.
- Keep fixtures focused on a single scenario.
- Avoid unnecessary fixture complexity.

example:
```
fixtures/
├── openai/
├── lmstudio/
└── qwen/
```

### Mocking

- Mock only external dependencies.
- Do not mock internal package boundaries unless necessary.


## 7. Architectural Naming

Names should represent architectural concepts rather than implementation details.

### Packages

Package names should describe architectural responsibilities rather than technologies.

Examples:

```
compatibility
provider
protocol
config
shared
```

### Internal Models

Internal models should use gateway-oriented names.

These models represent the AI Gateway architecture rather than any external API.

Good:

```
GatewayRequest
GatewayResponse
ToolCall
CompatibilityProfile
ProviderConfig
```

Avoid:

```
OpenAIRequest
LMStudioRequest
ChatCompletionRequest
```

### Provider-specific Models

Provider-specific names are allowed only within the corresponding provider package.

Examples:

```
packages/provider/lmstudio/
    LMStudioRequest
    LMStudioStreamChunk

packages/provider/openai/
    OpenAIRequest
    OpenAIResponse
```

Outside the `provider` package, use types defined in `@ai-gateway/protocol` whenever possible.

## 8. Configuration

Configuration should remain explicit, predictable, and aligned with architectural responsibilities.

### Configuration Principles

- Prefer explicit configuration over automatic discovery.
- Each package owns its own configuration.
- Configuration should describe gateway concepts rather than implementation details.
- Keep configuration independent between packages whenever possible.

### Configuration Organization

Configuration should be organized according to package responsibilities.

Examples:

```
server:
provider:
compatibility:
```

Avoid grouping unrelated configuration into a single section.

### Configuration Models

Configuration models should be defined within the package that owns them.

Examples:

```
packages/config/
    GatewayConfig

packages/provider/
    ProviderConfig

packages/compatibility/
    CompatibilityConfig
```

Configuration objects should be converted into strongly typed models before use.

### Future Configuration

Additional configuration may be introduced as the project evolves.

New configuration should follow the same architectural boundaries without requiring changes to existing packages.


---

## Evolution

This document defines the current development practices for AI Gateway.

Development guidelines should evolve together with the project architecture.

Avoid introducing new rules unless they solve a concrete development problem.
