import type { ProviderAdapter } from "@ai-gateway/provider";

import {
  createGatewayApplication,
  type CompatibilityPipeline,
  type ProviderExecutor,
} from "./index.js";

export interface DevelopmentGatewayOptions {
  readonly host?: string;
  readonly port?: number;
}

const developmentProviderId = "development";

const developmentAdapter: ProviderAdapter = {
  providerId: developmentProviderId,
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

const developmentPipeline: CompatibilityPipeline = {
  async processRequest(request) {
    return request;
  },
  async processResponse(response) {
    return response;
  },
};

const developmentExecutor: ProviderExecutor = {
  async execute(request, _adapter, _context) {
    return { echoed: request };
  },
};

export function createDevelopmentGatewayApplication(options: DevelopmentGatewayOptions = {}) {
  const application = createGatewayApplication(developmentPipeline, developmentExecutor, {
    inboundProviderId: developmentProviderId,
    outboundProviderId: developmentProviderId,
    host: options.host ?? "127.0.0.1",
    port: options.port ?? 8080,
  });
  application.registry.register(developmentAdapter);
  return application;
}
