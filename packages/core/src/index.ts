/**
 * Pure domain logic package (ADR-0001).
 * No I/O, no frameworks — economics, scoring, confidence, and risk live here in later phases.
 */

/** Workspace/package identity used by health checks and tests. */
export const PACKAGE_NAME = "@aipro/core" as const;

/** Placeholder version stamp until Phase 4 calculation versioning lands. */
export const CORE_VERSION = "0.0.0" as const;

export function getCoreIdentity(): { name: typeof PACKAGE_NAME; version: typeof CORE_VERSION } {
  return { name: PACKAGE_NAME, version: CORE_VERSION };
}
