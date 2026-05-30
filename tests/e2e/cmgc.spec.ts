// @e2e — runs against a deployed instance, requires real OpenAI API key.
// Local: BASE_URL=http://localhost:3000 npx playwright test --project=deployed
// Deployed: BASE_URL=https://govdoc-xxx.run.app npx playwright test --project=deployed
//
// Skipped automatically if OPENAI_API_KEY is not set.
import { test, expect } from "@playwright/test";

test.describe("CMGC happy path", () => {
  test("upload → evaluate → score → exporters visible @e2e", async ({ page }) => {
    test.skip(!process.env.OPENAI_API_KEY, "OPENAI_API_KEY not set — skipping real-LLM e2e");
    test.skip(!process.env.GOVDOC_DEV_USER || !process.env.GOVDOC_DEV_PASS, "GOVDOC_DEV_USER/PASS not set");

    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.GOVDOC_DEV_USER!);
    await page.fill('input[name="password"]', process.env.GOVDOC_DEV_PASS!);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/workspace$/);
    await page.click("text=Validate Documents");
    await page.click("text=CMGC");
    await page.setInputFiles('input[name="factSheet"]', "tests/fixtures/cmgc/synthetic-narrative.docx");
    // Reviewer role is required at upload time.
    await page.click('input[name="role"][value="district"]');
    await page.click('button:has-text("Run evaluation")');

    // Wait for the done view (composite score appears in the recommendation card)
    await expect(page.getByText(/Composite \d\.\d{3} \/ 3\.000/)).toBeVisible({ timeout: 240_000 });
    // Exporter buttons
    await expect(page.getByRole("button", { name: /Download Excel/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Download DOCX/i })).toBeVisible();
  });
});
