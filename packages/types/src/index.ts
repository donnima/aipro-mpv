/**
 * Shared Zod schemas and contracts.
 * Populated in later phases; placeholder export keeps the package resolvable.
 */

export type HealthStatus = "ok" | "degraded" | "error";

export interface HealthResponse {
  status: HealthStatus;
  version: string;
  commit: string;
}
