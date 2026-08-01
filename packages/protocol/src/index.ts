/** Protocol definitions - shared request/response types */
export const protocolVersion = "0.0.1";

export interface GatewayRequest {
  readonly raw: unknown;
  readonly metadata: Record<string, unknown>;
}

export interface GatewayResponse {
  readonly raw: unknown;
  readonly metadata: Record<string, unknown>;
}

export interface ProcessingContext {
  readonly metadata: Map<string, unknown>;
}
