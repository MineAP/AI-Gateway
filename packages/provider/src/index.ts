import type {
  GatewayRequest,
  GatewayResponse,
  ProcessingContext,
} from "@ai-gateway/protocol";

/** AI Provider Adapter - provider-specific interfaces */
export const providerVersion = "0.0.1";

export interface ProviderAdapter {
  readonly providerId: string;
  parseRequest(request: unknown, context: ProcessingContext): Promise<GatewayRequest>;
  buildRequest(request: GatewayRequest, context: ProcessingContext): Promise<unknown>;
  parseResponse(response: unknown, context: ProcessingContext): Promise<GatewayResponse>;
  buildResponse(response: GatewayResponse, context: ProcessingContext): Promise<unknown>;
}

export class ProviderRegistry {
  private readonly adapters = new Map<string, ProviderAdapter>();

  register(adapter: ProviderAdapter): void {
    if (this.adapters.has(adapter.providerId)) {
      throw new Error(`Provider adapter already registered: ${adapter.providerId}`);
    }

    this.adapters.set(adapter.providerId, adapter);
  }

  resolve(providerId: string): ProviderAdapter {
    const adapter = this.adapters.get(providerId);
    if (!adapter) {
      throw new Error(`Provider adapter is not registered: ${providerId}`);
    }

    return adapter;
  }
}
