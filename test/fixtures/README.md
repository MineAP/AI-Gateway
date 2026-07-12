# Test Fixtures

This directory contains protocol fixtures used by AI Gateway compatibility
tests.

Fixtures represent real protocol examples captured from AI clients and AI
providers. They provide reproducible inputs and expected outputs for validating
compatibility behavior.

---

# Purpose

Fixtures are used to verify protocol transformations performed by AI Gateway.

Whenever practical, fixtures should be added before implementing compatibility
logic.

---

# Directory Layout

```text
fixtures/

├── openai/
│   ├── requests/
│   ├── responses/
│   └── streams/
│
├── lmstudio/
│   ├── requests/
│   ├── responses/
│   └── streams/
│
└── internal/
    ├── requests/
    └── responses/
```

- **openai/**
  - Raw protocol data captured from the OpenAI Responses API.

- **lmstudio/**
  - Raw protocol data captured from LM Studio's OpenAI-compatible API.

- **internal/**
  - Expected Gateway Internal Model representations.

---

# Naming

Use descriptive filenames based on the compatibility feature being tested.

Examples:

```text
tool-call.json
tool-result.json
namespace-tools.json
parallel-tool-calls.json
```

Avoid provider-specific names unless they represent provider-specific behavior.

---

# Guidelines

- Store raw protocol captures separately from reusable fixtures (for example under `.local/tmp/fixture/raw/`).
- Prefer real protocol captures over handcrafted JSON.
- Keep reusable fixtures as small as practical and focused on a single compatibility scenario.
- Preserve provider-specific fields whenever possible.
- Remove or anonymize sensitive information before committing.
- Do not modify captured payloads unless required for anonymization.

---

# Relationship

A compatibility test typically compares the following representations:

```text
OpenAI Request
        │
        ▼

Gateway Internal Request
        │
        ▼

LM Studio Request
```

or

```text
LM Studio Response
        │
        ▼

Gateway Internal Response
        │
        ▼

OpenAI Response
```

The Internal representation acts as the expected internal contract between
Provider Adapters and the Compatibility Pipeline.

---

# Scope

REQ-001 introduces fixtures for Function Calling compatibility.

Additional fixture sets will be added as new compatibility features are
implemented.