import { describe, expect, it } from "vitest";

import { ProviderRegistry, type ProviderAdapter } from "../src/index.js";

const adapter: ProviderAdapter = {
  providerId: "test",
  async parseRequest(request) {
    return { raw: request, metadata: {} };
  },
  async buildRequest(request) {
    return request.raw;
  },
  async parseResponse(response) {
    return { raw: response, metadata: {} };
  },
  async buildResponse(response) {
    return response.raw;
  },
};

describe("ProviderRegistry", () => {
  it("resolves a registered provider adapter", () => {
    const registry = new ProviderRegistry();
    registry.register(adapter);

    expect(registry.resolve("test")).toBe(adapter);
  });

  it("rejects unknown and duplicate provider identifiers", () => {
    const registry = new ProviderRegistry();
    registry.register(adapter);

    expect(() => registry.register(adapter)).toThrow("already registered");
    expect(() => registry.resolve("missing")).toThrow("is not registered");
  });
});
