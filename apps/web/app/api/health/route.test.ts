import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns 200 with status, version, and commit", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      status: string;
      version: string;
      commit: string;
    };

    expect(body).toEqual({
      status: "ok",
      version: expect.any(String),
      commit: expect.any(String),
    });
    expect(body.version.length).toBeGreaterThan(0);
    expect(body.commit.length).toBeGreaterThan(0);
  });
});
