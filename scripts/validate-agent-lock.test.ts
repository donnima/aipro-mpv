import { describe, expect, it } from "vitest";
import {
  extractPaths,
  parseStatusFields,
  referencesDraftPath,
  validateAgentLock,
} from "./validate-agent-lock.mjs";

function statusDoc(overrides: Record<string, string>): string {
  const base: Record<string, string> = {
    "Active Agent": "none",
    "Write Lock Owner": "none",
    "Active Task": "none",
    "Authoritative Commit": "0e23ead",
    "Allowed Paths": "none",
    "Forbidden Paths": "packages/db/**",
    "Next Action": "Founder supplies DATABASE_URL",
    ...overrides,
  };
  const rows = Object.entries(base)
    .map(([k, v]) => `| **${k}** | ${v} |`)
    .join("\n");
  return `# CURRENT_STATUS\n\n## Agent lock\n\n| Field | Value |\n| --- | --- |\n${rows}\n`;
}

describe("parseStatusFields", () => {
  it("reads bold lock fields from a markdown table", () => {
    const fields = parseStatusFields(statusDoc({}));
    expect(fields["write lock owner"]).toBe("none");
    expect(fields["active agent"]).toBe("none");
    expect(fields["authoritative commit"]).toBe("0e23ead");
  });
});

describe("referencesDraftPath", () => {
  it("detects docs/drafts and *.draft.md", () => {
    expect(referencesDraftPath("see docs/drafts/foo.md")).toBe(true);
    expect(referencesDraftPath("review.draft.md")).toBe(true);
    expect(referencesDraftPath("docs/reviews/TASK-001-CLAUDE-REVIEW.md")).toBe(false);
  });
});

describe("extractPaths", () => {
  it("extracts markdown paths from field values", () => {
    expect(extractPaths("`docs/reviews/TASK-002-PART-A-CLAUDE-REVIEW.md`")).toContain(
      "docs/reviews/TASK-002-PART-A-CLAUDE-REVIEW.md",
    );
  });
});

describe("validateAgentLock", () => {
  it("fails when Write Lock Owner is missing", () => {
    const without = statusDoc({}).replace(/\| \*\*Write Lock Owner\*\* \| none \|\n/, "");
    const r = validateAgentLock(without);
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => /no Write Lock Owner/i.test(e))).toBe(true);
  });

  it("fails when Cursor is active while Claude owns the write lock", () => {
    const result = validateAgentLock(
      statusDoc({
        "Active Agent": "Cursor",
        "Write Lock Owner": "Claude",
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /Cursor.*Claude/i.test(e))).toBe(true);
  });

  it("fails when authoritative review points to an uncommitted file", () => {
    const result = validateAgentLock(
      statusDoc({
        "Authoritative Review": "docs/reviews/DOES-NOT-EXIST-CLAUDE-REVIEW.md",
      }),
      {
        isTracked: () => false,
      },
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /uncommitted|does not exist/i.test(e))).toBe(true);
  });

  it("fails when docs/drafts is referenced as active instructions", () => {
    const result = validateAgentLock(
      statusDoc({
        "Authoritative Review": "docs/drafts/review.draft.md",
      }),
      { isTracked: () => true },
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /drafts/i.test(e))).toBe(true);
  });

  it("fails when Active Task points at a draft file", () => {
    const result = validateAgentLock(
      statusDoc({
        "Active Task": "implement notes in notes.draft.md",
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /draft/i.test(e))).toBe(true);
  });

  it("passes a valid idle lock block", () => {
    const result = validateAgentLock(statusDoc({}), {
      isTracked: () => true,
    });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("passes when Cursor holds lock and is active", () => {
    const result = validateAgentLock(
      statusDoc({
        "Active Agent": "Cursor",
        "Write Lock Owner": "Cursor",
        "Active Task": "AGENT-LOCK-PROTOCOL",
        "Allowed Paths": "AGENTS.md, CLAUDE.md, docs/process/**",
      }),
      { isTracked: () => true },
    );
    expect(result.ok).toBe(true);
  });

  it("passes when a committed docs/reviews path is authoritative", () => {
    const reviewPath = "docs/reviews/TASK-001-CLAUDE-REVIEW.md";
    const result = validateAgentLock(
      statusDoc({
        "Authoritative Review": reviewPath,
        "Authoritative Review Commit": "a5655a7",
        "Cursor Action Permitted": "no",
      }),
      {
        isTracked: (p) => p === reviewPath,
      },
    );
    expect(result.ok).toBe(true);
  });
});
