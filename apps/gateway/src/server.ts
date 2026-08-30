import { createServer, type Server } from "node:http";

import type {
  DispatchOptions,
  GatewayRequestDispatcher,
} from "./dispatcher.js";

export interface GatewayServerOptions extends DispatchOptions {
  readonly host?: string;
  readonly port: number;
}

export function createGatewayServer(
  dispatcher: GatewayRequestDispatcher,
  options: DispatchOptions,
): Server {
  return createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (request.method !== "POST" || url.pathname !== "/v1/chat/completions") {
      response.writeHead(404).end();
      return;
    }

    try {
      const body = await readJsonBody(request);
      const result = await dispatcher.dispatch(body, options);
      response
        .writeHead(200, { "content-type": "application/json" })
        .end(JSON.stringify(result));
    } catch (error) {
      const statusCode = error instanceof BadRequestError ? 400 : 500;
      const message =
        error instanceof BadRequestError
          ? error.message
          : "Internal server error";
      response
        .writeHead(statusCode, { "content-type": "application/json" })
        .end(JSON.stringify({ error: { message } }));
    }
  });
}

export function startGatewayServer(
  server: Server,
  options: GatewayServerOptions,
): Promise<Server> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("error", onError);
      reject(error);
    };

    server.once("error", onError);
    server.listen(options.port, options.host, () => {
      server.off("error", onError);
      resolve(server);
    });
  });
}

function readJsonBody(request: NodeJS.ReadableStream): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      body += chunk;
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new BadRequestError("Request body must be valid JSON"));
      }
    });
    request.on("error", reject);
  });
}

class BadRequestError extends Error {}
