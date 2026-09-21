import {
  CompatibilityPipeline,
  openaiResponsesProfile,
} from "@ai-gateway/compatibility";
import type { ProviderAdapter } from "@ai-gateway/provider";

import { createGatewayApplication, type ProviderExecutor } from "./index.js";

export interface DevelopmentGatewayOptions {
  readonly host?: string;
  readonly port?: number;
}

const developmentProviderId = "development";

const developmentAdapter: ProviderAdapter = {
  providerId: developmentProviderId,
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

const developmentPipeline = new CompatibilityPipeline();
for (const module of openaiResponsesProfile.modules) {
  developmentPipeline.register(module);
}

const developmentExecutor: ProviderExecutor = {
  async execute(request, _adapter, _context) {
    return { echoed: request };
  },
};

export function createDevelopmentGatewayApplication(
  options: DevelopmentGatewayOptions = {},
) {
  const application = createGatewayApplication(
    developmentPipeline,
    developmentExecutor,
    {
      inboundProviderId: developmentProviderId,
      outboundProviderId: developmentProviderId,
      host: options.host ?? "127.0.0.1",
      port: options.port ?? 8080,
    },
  );
  application.registry.register(developmentAdapter);
  return application;
}
