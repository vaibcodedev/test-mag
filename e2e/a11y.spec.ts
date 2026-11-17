import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Автоматична перевірка WCAG 2.1 A/AA на ключових сторінках у двох ширинах.
 * axe знаходить лише частину проблем доступності: клавіатуру, порядок фокуса
 * й зміст підписів усе одно треба перевіряти руками.
 */
const PAGES = [
  "/",
  "/collections",
  "/collections/iphone",
  "/products/iphone-17-pro",
  "/search?q=phone",
  "/search?q=zzzz",
  "/cart",
  "/wishlist",
  "/compare",
  "/pages/delivery",
  "/pages/contacts",
  "/blogs/blog",
  "/account",
  "/no-such-page",
  "/styleguide",
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

for (const viewport of VIEWPORTS) {
  for (const path of PAGES) {
    test(`a11y ${viewport.name} ${path}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 60_000 });

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const summary = results.violations.map((violation) => ({
        rule: violation.id,
        impact: violation.impact,
        count: violation.nodes.length,
        targets: violation.nodes.slice(0, 4).map((node) => node.target.join(" ")),
        why: violation.nodes[0]?.failureSummary?.replace(/\s+/g, " ").slice(0, 220),
      }));

      expect(summary).toEqual([]);
    });
  }
}
