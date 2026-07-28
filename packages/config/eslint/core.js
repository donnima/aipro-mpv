/**
 * Purity boundary for packages/core (ADR-0001).
 * Forbids framework and I/O imports so domain logic stays extractable.
 */
import base from "./base.js";

const bannedModules = [
  "next",
  "next/*",
  "react",
  "react-dom",
  "react/*",
  "react-dom/*",
  "@prisma/client",
  "prisma",
];

const bannedNodeBuiltins = [
  "fs",
  "fs/promises",
  "path",
  "os",
  "child_process",
  "net",
  "http",
  "https",
  "crypto",
  "stream",
  "worker_threads",
  "node:fs",
  "node:fs/promises",
  "node:path",
  "node:os",
  "node:child_process",
  "node:net",
  "node:http",
  "node:https",
  "node:crypto",
  "node:stream",
  "node:worker_threads",
];

/** @type {import("eslint").Linter.Config[]} */
const core = [
  ...base,
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [...bannedModules, ...bannedNodeBuiltins].map((name) => ({
            name,
            message:
              "@aipro/core must remain pure: no Next.js, React, Prisma, or Node built-in I/O (ADR-0001).",
          })),
          patterns: [
            {
              group: ["next/*", "react/*", "react-dom/*", "@prisma/*", "node:*"],
              message:
                "@aipro/core must remain pure: no Next.js, React, Prisma, or Node built-in I/O (ADR-0001).",
            },
          ],
        },
      ],
    },
  },
];

export default core;
