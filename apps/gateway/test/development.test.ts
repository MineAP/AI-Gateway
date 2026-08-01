import { afterEach, describe, expect, it } from "vitest";

import { createDevelopmentGatewayApplication } from "../src/development.js";

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

describe("development gateway", () => {
  it("starts an echo server", async () => {
    const application = createDevelopmentGatewayApplication({ port: 0 });
    await application.start();
    servers.push(application.server);

    const address = application.server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected an HTTP address");
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/v1/chat/completions`, {
      method: "POST",
      body: JSON.stringify({ model: "development" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ echoed: { model: "development" } });
  });
});
