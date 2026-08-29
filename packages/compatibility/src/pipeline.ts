import type { GatewayRequest, GatewayResponse, ProcessingContext } from "@ai-gateway/protocol";
import type { CompatibilityModule } from "./module.js";

/** Error thrown when a compatibility module fails during pipeline execution. */
export class PipelineError extends Error {
  constructor(readonly moduleName: string, message: string) {
    super(message);
    this.name = "PipelineError";
  }
}

/**
 * CompatibilityPipeline executes registered modules in deterministic order
 * for both request and response processing.
 */
export class CompatibilityPipeline {
  private readonly modules: CompatibilityModule[] = [];

  /** Register a module. Modules execute in registration order. */
  register(module: CompatibilityModule): void {
    if (this.modules.some((m) => m.name === module.name)) {
      throw new Error(`Module already registered: ${module.name}`);
    }
    this.modules.push(module);
  }

  /** Execute all request modules in order. Returns the original request when no modules are registered. */
  async processRequest(
    request: GatewayRequest,
    context: ProcessingContext,
  ): Promise<GatewayRequest> {
    let current = request;
    for (const module of this.modules) {
      if (!module.processRequest) continue;
      try {
        current = await module.processRequest(current, context);
      } catch (error) {
        throw new PipelineError(
          module.name,
          `Module "${module.name}" failed during request processing: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    return current;
  }

  /** Execute all response modules in reverse registration order. Returns the original response when no modules are registered. */
  async processResponse(
    response: GatewayResponse,
    context: ProcessingContext,
  ): Promise<GatewayResponse> {
    let current = response;
    for (const module of [...this.modules].reverse()) {
      if (!module.processResponse) continue;
      try {
        current = await module.processResponse(current, context);
      } catch (error) {
        throw new PipelineError(
          module.name,
          `Module "${module.name}" failed during response processing: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    return current;
  }
}
