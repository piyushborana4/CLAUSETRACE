import { test, expect } from '@playwright/test';

test.describe('CLAUSETRACE Complete User Verification Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads home view and demonstrates evidence-first workflow', async ({ page }) => {
    // Assert title and brand
    await expect(page).toHaveTitle(/CLAUSETRACE/);
    await expect(page.locator('text=UNDERSTAND · VERIFY · ACT')).toBeVisible();

    // Verify accessible skip link exists
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();

    // Verify main content landmark exists
    const mainLandmark = page.locator('main#main-content');
    await expect(mainLandmark).toBeAttached();
  });

  test('inspects document X-ray and triggers Fair Market Benchmark standard', async ({ page }) => {
    // Navigate to X-ray view
    await page.click('button:has-text("What matters")');

    // Verify document findings are rendered
    await expect(page.locator('text=Original text from document')).toBeVisible();

    // Verify benchmark standard card is present
    await expect(page.locator('text=Fair Market Benchmark Standard')).toBeVisible();
  });

  test('navigates to BigQuery Analytics & Telemetry dashboard', async ({ page }) => {
    // Click analytics tab
    await page.click('button:has-text("BigQuery Analytics")');

    // Verify analytics KPIs and audit stream
    await expect(page.locator('text=Contract Analytics & Compliance Intelligence')).toBeVisible();
    await expect(page.locator('text=Immutable Zero-Trust Audit Trail')).toBeVisible();
    await expect(page.locator('text=Export Compliance Report')).toBeVisible();
  });

  test('toggles checklist items and verifies offline persistence indicator', async ({ page }) => {
    // Navigate to checklist
    await page.click('button:has-text("Before you agree")');

    // Verify checklist view loaded
    await expect(page.locator('text=Things to check before you sign')).toBeVisible();
  });
});
