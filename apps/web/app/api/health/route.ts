import { CORE_VERSION } from "@aipro/core";
import type { HealthResponse } from "@aipro/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function resolveVersion(): string {
  return process.env.APP_VERSION ?? process.env.npm_package_version ?? "0.0.0";
}

function resolveCommit(): string {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
    process.env.GITHUB_SHA?.slice(0, 7) ??
    process.env.COMMIT_SHA?.slice(0, 7) ??
    "local"
  );
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const body: HealthResponse = {
    status: "ok",
    version: resolveVersion(),
    commit: resolveCommit(),
  };

  // Touch core package so the workspace boundary is exercised at runtime.
  void CORE_VERSION;

  return NextResponse.json(body);
}
