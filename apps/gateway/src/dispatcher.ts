import type {
  GatewayRequest,
  GatewayResponse,
  ProcessingContext,
} from "@ai-gateway/protocol";
import type { ProviderAdapter } from "@ai-gateway/provider";
import { ProviderRegistry } from "@ai-gateway/provider";

export interface CompatibilityPipeline {
  processRequest(request: GatewayRequest, context: ProcessingContext): Promise<GatewayRequest>;
  processResponse(response: GatewayResponse, context: ProcessingContext): Promise<GatewayResponse>;
}

export interface ProviderExecutor {
  execute(request: unknown, adapter: ProviderAdapter, context: ProcessingContext): Promise<unknown>;
}

export interface DispatchOptions {
  readonly inboundProviderId: string;
  readonly outboundProviderId: string;
}

export class GatewayRequestDispatcher {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly pipeline: CompatibilityPipeline,
    private readonly executor: ProviderExecutor,
  ) {}

  async dispatch(request: unknown, options: DispatchOptions): Promise<unknown> {
    const context: ProcessingContext = { metadata: new Map() };
    const inboundAdapter = this.registry.resolve(options.inboundProviderId);
    const outboundAdapter = this.registry.resolve(options.outboundProviderId);
    const inboundRequest = await inboundAdapter.parseRequest(request, context);
    const compatibleRequest = await this.pipeline.processRequest(inboundRequest, context);
    const providerRequest = await outboundAdapter.buildRequest(compatibleRequest, context);
    const providerResponse = await this.executor.execute(providerRequest, outboundAdapter, context);
    const outboundResponse = await outboundAdapter.parseResponse(providerResponse, context);
    const compatibleResponse = await this.pipeline.processResponse(outboundResponse, context);

    return inboundAdapter.buildResponse(compatibleResponse, context);
  }
}
