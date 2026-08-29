import type { GatewayRequest, GatewayResponse, ProcessingContext } from "@ai-gateway/protocol";

/**
 * A Compatibility Module performs one specific compatibility transformation
 * on the Gateway Internal Model.
 */
export interface CompatibilityModule {
  /** Identifier for this module. Used for diagnostics and ordering. */
  readonly name: string;

  /** Transform the request. Optional — omit if this module does not process requests. */
  processRequest?(
    request: GatewayRequest,
    context: ProcessingContext,
  ): Promise<GatewayRequest>;

  /** Transform the response. Optional — omit if this module does not process responses. */
  processResponse?(
    response: GatewayResponse,
    context: ProcessingContext,
  ): Promise<GatewayResponse>;
}
