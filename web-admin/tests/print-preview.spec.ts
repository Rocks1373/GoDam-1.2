import { expect, test } from "@playwright/test";

test.describe("Delivery note print preview", () => {
  test("opens the preview modal and triggers window.print", async ({ page }) => {
    await page.addInitScript(() => {
      const win = window as unknown as { __printSpy: number; print: () => void };
      win.__printSpy = 0;
      window.print = () => {
        win.__printSpy += 1;
      };
    });

    await page.goto("/delivery-notes", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Delivery Note Creation" })).toBeVisible();

    await page.getByRole("button", { name: "Print" }).first().click();
    const modal = page.locator(".print-preview-modal");
    await expect(modal).toBeVisible();

    await modal.getByRole("button", { name: "Print" }).click();
    await page.waitForFunction(() => {
      const win = window as unknown as { __printSpy: number };
      return win.__printSpy > 0;
    }, null, {
      timeout: 5000,
    });

    const printCount = await page.evaluate(() => {
      const win = window as unknown as { __printSpy: number };
      return win.__printSpy;
    });
    expect(printCount).toBeGreaterThan(0);
  });
});

