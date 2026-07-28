/**
 * Purity boundary for packages/core (ADR-0001).
 * Forbids framework and I/O imports so domain logic stays extractable.
 *
 * Coverage:
 * - static import / export-from via no-restricted-imports
 * - dynamic import() and require() via no-restricted-syntax (anchored regexes)
 * - every Node builtin from module.builtinModules (bare + node: prefix)
 * - workspace I/O packages banned; only @aipro/types is an allowed workspace import
 */
import { builtinModules } from "node:module";
import base from "./base.js";

const PURITY_MESSAGE =
  "@aipro/core must remain pure: no Next.js, React, Prisma, Node I/O, or workspace I/O packages (ADR-0001).";

/** Framework / ORM modules that must never enter packages/core. */
const bannedFrameworkModules = ["next", "react", "react-dom", "@prisma/client", "prisma"];

/**
 * Workspace packages that perform I/O or bind frameworks.
 * Allow-list counterpart: only `@aipro/types` (plus relative imports) is permitted.
 * When adding a new workspace package, ban it here unless it is pure types/contracts.
 */
const bannedWorkspacePackages = ["@aipro/db", "@aipro/web", "@aipro/ui", "@aipro/config"];

/**
 * Full Node builtin set from the running Node version.
 * Strip any node: prefix so we can ban both bare and prefixed forms.
 */
const bareBuiltins = [
  ...new Set(
    builtinModules
      .map((name) => (name.startsWith("node:") ? name.slice("node:".length) : name))
      .filter((name) => name.length > 0 && !name.startsWith("_")),
  ),
].sort();

function escapeRegex(value) {
  // Escape regex metacharacters and `/` — esquery embeds the pattern as /…/
  // so an unescaped slash would terminate the selector regex early.
  return value.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
}

/** Matches banned module ids including subpaths (next/server, fs/promises, @aipro/db/…). */
const bannedModuleRegexSource = [
  ...bannedFrameworkModules.map((name) => `${escapeRegex(name)}(?:\\/.*)?`),
  ...bannedWorkspacePackages.map((name) => `${escapeRegex(name)}(?:\\/.*)?`),
  ...bareBuiltins.map((name) => `${escapeRegex(name)}`),
  ...bareBuiltins.map((name) => `node:${escapeRegex(name)}`),
].join("|");

const bannedModuleRegex = new RegExp(`^(?:${bannedModuleRegexSource})$`);

const restrictedImportPaths = [
  ...bannedFrameworkModules.map((name) => ({ name, message: PURITY_MESSAGE })),
  ...bannedWorkspacePackages.map((name) => ({ name, message: PURITY_MESSAGE })),
  ...bareBuiltins.flatMap((name) => [
    { name, message: PURITY_MESSAGE },
    { name: `node:${name}`, message: PURITY_MESSAGE },
  ]),
];

/**
 * Anchored esquery regexes — without ^…$ a specifier that merely *contains*
 * a builtin name (e.g. "./costs", "./path-utils") falsely matches (A-1).
 */
const dynamicImportSelector = `ImportExpression[source.type='Literal'][source.value=/^(?:${bannedModuleRegexSource})$/]`;
const requireSelector = `CallExpression[callee.name='require'][arguments.0.type='Literal'][arguments.0.value=/^(?:${bannedModuleRegexSource})$/]`;

/** @type {import("eslint").Linter.Config[]} */
const core = [
  ...base,
  {
    files: ["src/**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    rules: {
      "@typescript-eslint/no-require-imports": "error",
      "no-restricted-imports": [
        "error",
        {
          paths: restrictedImportPaths,
          patterns: [
            {
              group: [
                "next/*",
                "react/*",
                "react-dom/*",
                "@prisma/*",
                "node:*",
                "@aipro/db/*",
                "@aipro/web/*",
                "@aipro/ui/*",
                "@aipro/config/*",
              ],
              message: PURITY_MESSAGE,
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: dynamicImportSelector,
          message: PURITY_MESSAGE,
        },
        {
          selector: requireSelector,
          message: PURITY_MESSAGE,
        },
      ],
    },
  },
];

export { bannedModuleRegex, bareBuiltins, bannedWorkspacePackages, PURITY_MESSAGE };
export default core;
