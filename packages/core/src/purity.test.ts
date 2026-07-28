/**
 * Self-testing purity boundary for @aipro/core (TASK-002 Part A / ADR-0001).
 *
 * Lints in-memory snippets through the package ESLint config via the ESLint
 * Node API. Does not import Node builtins into production source — only
 * eslint and vitest (devDependencies), which are outside the banned set.
 */
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

/** packages/core root — import.meta.dirname is Node 22+, no path import needed. */
const packageRoot = import.meta.dirname.replace(/[\\/]src$/, "");

async function lintSnippet(code: string): Promise<ESLint.LintResult> {
  const eslint = new ESLint({
    cwd: packageRoot,
    // Override ignores so virtual fixture paths are always linted.
    ignore: false,
  });
  const [result] = await eslint.lintText(code, {
    filePath: `${packageRoot}/src/__purity_fixture__.ts`,
  });
  if (!result) {
    throw new Error("ESLint returned no result for purity fixture");
  }
  return result;
}

function errorMessages(result: ESLint.LintResult): string[] {
  return result.messages.filter((m) => m.severity === 2).map((m) => m.message);
}

describe("@aipro/core purity boundary", () => {
  it("rejects a static framework import", async () => {
    const result = await lintSnippet(`import next from "next";\nexport const x = next;\n`);
    expect(errorMessages(result).length).toBeGreaterThan(0);
    expect(errorMessages(result).join("\n")).toMatch(/must remain pure/i);
  });

  it("rejects a node:-prefixed builtin import", async () => {
    const result = await lintSnippet(`import path from "node:path";\nexport const x = path;\n`);
    expect(errorMessages(result).length).toBeGreaterThan(0);
  });

  it("rejects a bare Node builtin import", async () => {
    const result = await lintSnippet(`import dns from "dns";\nexport const x = dns;\n`);
    expect(errorMessages(result).length).toBeGreaterThan(0);
  });

  it("rejects dynamic import() of a banned module", async () => {
    const result = await lintSnippet(
      `export async function load(): Promise<unknown> {\n  return await import("next/server");\n}\n`,
    );
    expect(errorMessages(result).length).toBeGreaterThan(0);
    expect(errorMessages(result).join("\n")).toMatch(/must remain pure/i);
  });

  it("rejects require() of a banned module", async () => {
    const result = await lintSnippet(`const fs = require("fs");\nexport const x = fs;\n`);
    expect(errorMessages(result).length).toBeGreaterThan(0);
  });

  it("rejects export * from a banned module", async () => {
    const result = await lintSnippet(`export * from "react";\n`);
    expect(errorMessages(result).length).toBeGreaterThan(0);
  });

  it("allows a relative pure import", async () => {
    const result = await lintSnippet(
      `import { getCoreIdentity } from "./index";\nexport const id = getCoreIdentity();\n`,
    );
    expect(errorMessages(result)).toEqual([]);
  });

  it("allows an import from vitest in test fixtures", async () => {
    // vitest is not in the banned set; this guards against over-blocking.
    const result = await lintSnippet(
      `import { describe } from "vitest";\nexport const d = describe;\n`,
    );
    expect(errorMessages(result)).toEqual([]);
  });
});
