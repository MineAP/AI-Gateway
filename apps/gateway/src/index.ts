import { ProviderRegistry } from "@ai-gateway/provider";

import {
  type CompatibilityPipeline,
  GatewayRequestDispatcher,
  type ProviderExecutor,
} from "./dispatcher.js";
import {
  createGatewayServer,
  startGatewayServer,
  type GatewayServerOptions,
} from "./server.js";

/** HTTP API Endpoint - Gateway entry point */
export const gatewayVersion = "0.0.1";

export { GatewayRequestDispatcher, createGatewayServer, startGatewayServer };
export type {
  CompatibilityPipeline,
  DispatchOptions,
  GatewayServerOptions,
  ProviderExecutor,
};

export function createGatewayApplication(
  pipeline: CompatibilityPipeline,
  executor: ProviderExecutor,
  options: GatewayServerOptions,
) {
  const registry = new ProviderRegistry();
  const dispatcher = new GatewayRequestDispatcher(registry, pipeline, executor);
  const server = createGatewayServer(dispatcher, options);

  return {
    registry,
    dispatcher,
    server,
    start: () => startGatewayServer(server, options),
  };
}
