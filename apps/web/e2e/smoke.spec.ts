import { expect, test } from "@playwright/test";

/**
 * Placeholder E2E smoke test. Requires Playwright browsers (CI only until B-1 resolved).
 */
test.describe("health smoke", () => {
  test("home page renders the product name", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Product Intelligence Platform")).toBeVisible();
  });
});
