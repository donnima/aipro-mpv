/**
 * Purity boundary for packages/core (ADR-0001).
 * Forbids framework and I/O imports so domain logic stays extractable.
 *
 * Coverage:
 * - static import / export-from via no-restricted-imports
 * - dynamic import() and require() via no-restricted-syntax
 * - every Node builtin from module.builtinModules (bare + node: prefix)
 */
import { builtinModules } from "node:module";
import base from "./base.js";

const PURITY_MESSAGE =
  "@aipro/core must remain pure: no Next.js, React, Prisma, or Node built-in I/O (ADR-0001).";

/** Framework / ORM modules that must never enter packages/core. */
const bannedFrameworkModules = ["next", "react", "react-dom", "@prisma/client", "prisma"];

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

/** Matches banned module ids including subpaths (next/server, fs/promises, …). */
const bannedModuleRegexSource = [
  ...bannedFrameworkModules.map((name) => `${escapeRegex(name)}(?:\\/.*)?`),
  ...bareBuiltins.map((name) => `${escapeRegex(name)}`),
  ...bareBuiltins.map((name) => `node:${escapeRegex(name)}`),
].join("|");
const bannedModuleRegex = new RegExp(`^(?:${bannedModuleRegexSource})$`);

const restrictedImportPaths = [
  ...bannedFrameworkModules.flatMap((name) => [
    { name, message: PURITY_MESSAGE },
    // Subpath imports like next/server are covered by patterns below;
    // path entries still catch the exact package root.
  ]),
  ...bareBuiltins.flatMap((name) => [
    { name, message: PURITY_MESSAGE },
    { name: `node:${name}`, message: PURITY_MESSAGE },
  ]),
];

/**
 * ESLint selectors cannot interpolate RegExp objects — embed the source string.
 * ImportExpression[source.value=/…/] covers await import("…").
 * CallExpression require("…") covers CommonJS require of banned modules.
 */
const dynamicImportSelector = `ImportExpression[source.type='Literal'][source.value=/${bannedModuleRegexSource}/]`;
const requireSelector = `CallExpression[callee.name='require'][arguments.0.type='Literal'][arguments.0.value=/${bannedModuleRegexSource}/]`;

/** @type {import("eslint").Linter.Config[]} */
const core = [
  ...base,
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    rules: {
      "@typescript-eslint/no-require-imports": "error",
      "no-restricted-imports": [
        "error",
        {
          paths: restrictedImportPaths,
          patterns: [
            {
              group: ["next/*", "react/*", "react-dom/*", "@prisma/*", "node:*"],
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

export { bannedModuleRegex, bareBuiltins, PURITY_MESSAGE };
export default core;
