import { describe, expect, it } from "vitest";

import { getFallbackArticleBody } from "./articles";
import { getFallbackPage, isServicePageHandle, sectionsToText, SERVICE_PAGES } from "./pages";

describe("getFallbackPage", () => {
  it("має запасний вміст для кожної з семи сервісних сторінок", () => {
    expect(SERVICE_PAGES.map((page) => page.handle)).toEqual([
      "delivery",
      "installments",
      "warranty",
      "trade-in",
      "returns",
      "imei",
      "contacts",
    ]);

    for (const link of SERVICE_PAGES) {
      const page = getFallbackPage(link.handle);

      expect(page, link.handle).not.toBeNull();
      expect(page?.title).toBe(link.title);
      expect(page?.description.length).toBeGreaterThan(40);
      expect(page?.sections.length).toBeGreaterThan(0);
      for (const section of page?.sections ?? []) {
        expect(section.heading).not.toBe("");
        expect(section.blocks.length).toBeGreaterThan(0);
      }
    }
  });

  it("повертає null для невідомого handle і для властивостей прототипу", () => {
    expect(getFallbackPage("nope")).toBeNull();
    expect(getFallbackPage("")).toBeNull();
    expect(getFallbackPage("constructor")).toBeNull();
    expect(getFallbackPage("Delivery")).toBeNull();
  });

  it("тримається фактів магазину: строки гарантії, повернення та кількість платежів", () => {
    const text = (handle: string) => sectionsToText(getFallbackPage(handle)?.sections ?? []);

    expect(text("warranty")).toContain("12 місяців");
    expect(text("warranty")).toContain("6 місяців");
    expect(text("returns")).toContain("14 днів");
    expect(text("installments")).toContain("до 25 платежів");
    expect(text("installments")).toContain("до 24 платежів");
    expect(text("trade-in")).toContain("15 хвилин");
    expect(text("delivery")).toContain("Нова пошта");
  });

  it("не називає цін і тарифів", () => {
    for (const link of SERVICE_PAGES) {
      const page = getFallbackPage(link.handle);
      const text = `${page?.description} ${sectionsToText(page?.sections ?? [])}`;

      expect(text, link.handle).not.toMatch(/₴|грн|безкоштовн/i);
    }
  });
});

describe("isServicePageHandle", () => {
  it("розрізняє сервісні сторінки та інші handle", () => {
    expect(isServicePageHandle("trade-in")).toBe(true);
    expect(isServicePageHandle("about")).toBe(false);
  });
});

describe("getFallbackArticleBody", () => {
  it("віддає текст демо-статті та null для інших handle", () => {
    expect(getFallbackArticleBody("macbook-dlia-navchannia")?.length).toBeGreaterThan(0);
    expect(getFallbackArticleBody("nope")).toBeNull();
    expect(getFallbackArticleBody("toString")).toBeNull();
  });
});
