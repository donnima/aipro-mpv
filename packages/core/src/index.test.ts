import { describe, expect, it } from "vitest";
import { CORE_VERSION, getCoreIdentity, PACKAGE_NAME } from "./index";

describe("@aipro/core", () => {
  it("exposes a stable package identity for the workspace test runner", () => {
    expect(PACKAGE_NAME).toBe("@aipro/core");
    expect(CORE_VERSION).toBe("0.0.0");
    expect(getCoreIdentity()).toEqual({ name: "@aipro/core", version: "0.0.0" });
  });
});
