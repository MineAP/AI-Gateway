import { describe, expect, it } from "vitest";

import { type ProviderAdapter, ProviderRegistry } from "../src/index.js";

const adapter: ProviderAdapter = {
  providerId: "test",
  async parseRequest(request) {
    return { messages: [], rawData: request as Record<string, unknown> };
  },
  async buildRequest(request) {
    return request.rawData;
  },
  async parseResponse(response) {
    return { rawData: response as Record<string, unknown> };
  },
  async buildResponse(response) {
    return response.rawData;
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
