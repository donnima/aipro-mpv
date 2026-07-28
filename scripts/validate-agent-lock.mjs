#!/usr/bin/env node
/**
 * Agent Lock Protocol validator.
 * Fails when CURRENT_STATUS.md violates write-lock / authority rules.
 *
 * Usage: node scripts/validate-agent-lock.mjs [path-to-CURRENT_STATUS.md]
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

/** @typedef {{ ok: boolean, errors: string[], fields: Record<string, string> }} ValidationResult */

/**
 * Parse required lock fields from CURRENT_STATUS markdown.
 * Accepts table rows like `| **Write Lock Owner** | Cursor |` or `| Write Lock Owner | Cursor |`.
 * @param {string} markdown
 * @returns {Record<string, string>}
 */
export function parseStatusFields(markdown) {
  /** @type {Record<string, string>} */
  const fields = {};
  const rowRe = /^\|\s*\*?\*?([^|*]+?)\*?\*?\s*\|\s*([^|]*)\|/gm;
  let match;
  while ((match = rowRe.exec(markdown)) !== null) {
    const key = match[1].replace(/\*\*/g, "").trim().toLowerCase();
    const value = match[2].replace(/\*\*/g, "").trim();
    if (!key || key === "field" || key.startsWith("---")) continue;
    fields[key] = value;
  }
  return fields;
}

/**
 * @param {Record<string, string>} fields
 * @param {string} name
 * @returns {string}
 */
function field(fields, name) {
  return (fields[name.toLowerCase()] ?? "").trim();
}

/**
 * True if a path is a non-authoritative draft instruction source.
 * @param {string} value
 */
export function referencesDraftPath(value) {
  if (!value) return false;
  const normalized = value.replace(/\\/g, "/");
  if (/(^|[\s`"'(,])docs\/drafts\//i.test(normalized)) return true;
  if (/\.draft\.md\b/i.test(normalized)) return true;
  return false;
}

/**
 * Extract review-like paths from a status field value.
 * @param {string} value
 * @returns {string[]}
 */
export function extractPaths(value) {
  if (!value) return [];
  const paths = new Set();
  const re = /(?:^|[\s`"'(:,])((?:docs\/[^\s`'")|,]+\.md)|(?:[^\s`'")|,]+\.draft\.md))/gi;
  let match;
  while ((match = re.exec(value)) !== null) {
    paths.add(match[1].replace(/\\/g, "/"));
  }
  // Bare docs/drafts/… without .md still counts as a draft reference for instruction fields
  const draftDir = value.match(/docs\/drafts\/[^\s`'")|,]*/gi);
  if (draftDir) {
    for (const p of draftDir) paths.add(p.replace(/\\/g, "/"));
  }
  return [...paths];
}

/**
 * @param {string} filePath repo-relative path
 * @param {{ cwd?: string, isTracked?: (p: string) => boolean }} [opts]
 */
export function isGitTracked(filePath, opts = {}) {
  if (opts.isTracked) return opts.isTracked(filePath);
  const cwd = opts.cwd ?? REPO_ROOT;
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", filePath], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate Agent Lock rules against status markdown.
 * @param {string} markdown
 * @param {{ cwd?: string, isTracked?: (p: string) => boolean }} [opts]
 * @returns {ValidationResult}
 */
export function validateAgentLock(markdown, opts = {}) {
  const fields = parseStatusFields(markdown);
  /** @type {string[]} */
  const errors = [];

  const writeLockOwner = field(fields, "write lock owner");
  const activeAgent = field(fields, "active agent");
  const authoritativeReview = field(fields, "authoritative review");
  const activeTask = field(fields, "active task");
  const nextAction = field(fields, "next action");
  const cursorPermitted = field(fields, "cursor action permitted");

  if (!writeLockOwner) {
    errors.push("CURRENT_STATUS.md has no Write Lock Owner");
  }

  if (/^cursor$/i.test(activeAgent) && /^claude$/i.test(writeLockOwner)) {
    errors.push(
      "Active Agent is Cursor while Write Lock Owner is Claude (Cursor must not act under Claude's lock)",
    );
  }

  const instructionBlobs = [
    authoritativeReview,
    activeTask,
    nextAction,
    cursorPermitted,
    field(fields, "allowed paths"),
  ];

  for (const blob of instructionBlobs) {
    if (referencesDraftPath(blob)) {
      errors.push(`docs/drafts or *.draft.md referenced as active instructions: ${blob}`);
      break;
    }
  }

  // Authoritative review must be committed when a concrete docs/reviews path is named
  const reviewPaths = extractPaths(authoritativeReview).filter(
    (p) =>
      p.startsWith("docs/reviews/") ||
      p.startsWith("docs/handoffs/") ||
      p.startsWith("docs/tasks/"),
  );

  for (const reviewPath of reviewPaths) {
    const abs = path.join(opts.cwd ?? REPO_ROOT, reviewPath);
    if (!existsSync(abs)) {
      errors.push(`Authoritative review path does not exist on disk: ${reviewPath}`);
      continue;
    }
    if (!isGitTracked(reviewPath, opts)) {
      errors.push(`Authoritative review path points to an uncommitted file: ${reviewPath}`);
    }
  }

  // Required lock fields present (beyond write lock owner)
  const required = [
    "active agent",
    "active task",
    "authoritative commit",
    "allowed paths",
    "forbidden paths",
    "next action",
  ];
  for (const name of required) {
    if (!field(fields, name)) {
      errors.push(`CURRENT_STATUS.md missing required lock field: ${name}`);
    }
  }

  return { ok: errors.length === 0, errors, fields };
}

/**
 * @param {string} [statusPath]
 * @returns {ValidationResult}
 */
export function validateAgentLockFile(statusPath) {
  const resolved = statusPath ?? path.join(REPO_ROOT, "docs/status/CURRENT_STATUS.md");
  const markdown = readFileSync(resolved, "utf8");
  return validateAgentLock(markdown, {
    cwd: path.resolve(path.dirname(resolved), "../.."),
  });
}

function main() {
  const arg = process.argv[2];
  const result = validateAgentLockFile(arg);
  if (result.ok) {
    process.stdout.write("validate:agent-lock — OK\n");
    process.exit(0);
  }
  process.stderr.write("validate:agent-lock — FAILED\n");
  for (const err of result.errors) {
    process.stderr.write(`  - ${err}\n`);
  }
  process.exit(1);
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main();
}
