// @e2e — runs against a deployed instance, requires real OpenAI API key.
// Local: BASE_URL=http://localhost:3000 npx playwright test --project=deployed
// Deployed: BASE_URL=https://govdoc-xxx.run.app npx playwright test --project=deployed
//
// Skipped automatically if OPENAI_API_KEY is not set.
import { test, expect } from "@playwright/test";

test.describe("CUCP happy path", () => {
  test("upload → 3 LLM passes → review gate → finalize @e2e", async ({ page }) => {
    test.skip(!process.env.OPENAI_API_KEY, "OPENAI_API_KEY not set — skipping real-LLM e2e");
    test.skip(!process.env.GOVDOC_DEV_USER || !process.env.GOVDOC_DEV_PASS, "GOVDOC_DEV_USER/PASS not set");
    test.skip(!process.env.CUCP_E2E_NARRATIVE_PDF, "Set CUCP_E2E_NARRATIVE_PDF to a real narrative PDF path");

    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.GOVDOC_DEV_USER!);
    await page.fill('input[name="password"]', process.env.GOVDOC_DEV_PASS!);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/workspace$/);
    await page.click("text=Validate Documents");
    await page.click("text=CUCP");
    await page.setInputFiles('input[name="narrative"]', process.env.CUCP_E2E_NARRATIVE_PDF!);
    await page.click('button:has-text("Run re-evaluation")');

    await expect(page.getByRole("heading", { name: /7-criteria review/i })).toBeVisible({ timeout: 180_000 });
    await page.click('button:has-text("Submit overrides")');

    await expect(page.getByRole("button", { name: /Download Excel/i })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("button", { name: /Download DOCX/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Download full JSON/i })).toBeVisible();
  });
});
