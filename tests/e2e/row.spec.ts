// @e2e — runs against a deployed instance, requires real OpenAI API key.
// Local: BASE_URL=http://localhost:3000 npx playwright test --project=deployed
// Deployed: BASE_URL=https://govdoc-xxx.run.app npx playwright test --project=deployed
//
// Skipped automatically if OPENAI_API_KEY is not set.
import { test, expect } from "@playwright/test";

test.describe("ROW Appraisal happy path", () => {
  test("upload → 5-chunk evaluate → table visible @e2e", async ({ page }) => {
    test.skip(!process.env.OPENAI_API_KEY, "OPENAI_API_KEY not set — skipping real-LLM e2e");
    test.skip(!process.env.GOVDOC_DEV_USER || !process.env.GOVDOC_DEV_PASS, "GOVDOC_DEV_USER/PASS not set");
    test.skip(!process.env.ROW_E2E_PDF, "Set ROW_E2E_PDF to a real appraisal PDF path");

    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.GOVDOC_DEV_USER!);
    await page.fill('input[name="password"]', process.env.GOVDOC_DEV_PASS!);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/workspace$/);
    await page.click("text=Validate Documents");
    await page.click("text=ROW Appraisal");
    await page.setInputFiles('input[name="pdf"]', process.env.ROW_E2E_PDF!);
    await page.click('button:has-text("Run evaluation")');

    await expect(page.getByRole("table").first()).toBeVisible({ timeout: 210_000 });
    await expect(page.getByText("Title Page").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /download.*excel/i })).toBeVisible();
  });
});
