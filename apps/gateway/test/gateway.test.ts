import type { ProviderAdapter } from "@ai-gateway/provider";
import { afterEach, describe, expect, it } from "vitest";

import {
  type CompatibilityPipeline,
  createGatewayApplication,
  type ProviderExecutor,
} from "../src/index.js";

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

const pipeline: CompatibilityPipeline = {
  async processRequest(request) {
    return request;
  },
  async processResponse(response) {
    return response;
  },
};

const executor: ProviderExecutor = {
  async execute(request, _adapter, _context) {
    return { echoed: request };
  },
};

const failingExecutor: ProviderExecutor = {
  async execute(_request, _adapter, _context) {
    throw new Error("Provider credentials are invalid");
  },
};

const servers: Array<{ close(callback: (error?: Error) => void): void }> = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
});

describe("GatewayRequestDispatcher", () => {
  it("coordinates adapters, pipeline, and provider execution", async () => {
    const application = createGatewayApplication(pipeline, executor, {
      inboundProviderId: "test",
      outboundProviderId: "test",
      port: 0,
    });
    application.registry.register(adapter);

    await expect(
      application.dispatcher.dispatch(
        { model: "test" },
        {
          inboundProviderId: "test",
          outboundProviderId: "test",
        },
      ),
    ).resolves.toEqual({ echoed: { model: "test" } });
  });

  it("starts an HTTP server and dispatches OpenAI-compatible endpoint requests", async () => {
    const application = createGatewayApplication(pipeline, executor, {
      inboundProviderId: "test",
      outboundProviderId: "test",
      host: "127.0.0.1",
      port: 0,
    });
    application.registry.register(adapter);
    await application.start();
    servers.push(application.server);

    const address = application.server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an HTTP address");
    }

    const response = await fetch(
      `http://127.0.0.1:${address.port}/v1/chat/completions?trace=1`,
      {
        method: "POST",
        body: JSON.stringify({ model: "test" }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      echoed: { model: "test" },
    });
  });

  it("returns a client error for malformed JSON", async () => {
    const application = createGatewayApplication(pipeline, executor, {
      inboundProviderId: "test",
      outboundProviderId: "test",
      host: "127.0.0.1",
      port: 0,
    });
    application.registry.register(adapter);
    await application.start();
    servers.push(application.server);

    const address = application.server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an HTTP address");
    }

    const response = await fetch(
      `http://127.0.0.1:${address.port}/v1/chat/completions`,
      {
        method: "POST",
        body: "{",
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { message: "Request body must be valid JSON" },
    });
  });

  it("hides internal processing errors", async () => {
    const application = createGatewayApplication(pipeline, failingExecutor, {
      inboundProviderId: "test",
      outboundProviderId: "test",
      host: "127.0.0.1",
      port: 0,
    });
    application.registry.register(adapter);
    await application.start();
    servers.push(application.server);

    const address = application.server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an HTTP address");
    }

    const response = await fetch(
      `http://127.0.0.1:${address.port}/v1/chat/completions`,
      {
        method: "POST",
        body: JSON.stringify({ model: "test" }),
      },
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: { message: "Internal server error" },
    });
  });
});
