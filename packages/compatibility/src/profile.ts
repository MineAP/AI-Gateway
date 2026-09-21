import type { CompatibilityModule } from "./module.js";

/**
 * A provider-independent description of the compatibility modules required for a defined protocol/model combination.
 */
export interface CompatibilityProfile {
  /** Identifier used to select and diagnose this profile. */
  readonly name: string;

  /** Modules passed to the Compatibility Pipeline, in execution order. */
  readonly modules: readonly CompatibilityModule[];
}
