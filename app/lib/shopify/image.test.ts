import { describe, expect, it } from "vitest";

import { shopifyImageUrl, shopifySrcSet } from "./image";

const CDN = "https://cdn.shopify.com/s/files/1/iphone.png?v=1";

describe("shopifyImageUrl", () => {
  it("додає ширину до адреси з Shopify CDN і зберігає наявні параметри", () => {
    expect(shopifyImageUrl(CDN, { width: 480 })).toBe(
      "https://cdn.shopify.com/s/files/1/iphone.png?v=1&width=480",
    );
  });

  it("не чіпає сторонні та некоректні адреси", () => {
    expect(shopifyImageUrl("https://example.com/a.png", { width: 480 })).toBe(
      "https://example.com/a.png",
    );
    expect(shopifyImageUrl("/local.png", { width: 480 })).toBe("/local.png");
  });
});

describe("shopifySrcSet", () => {
  it("будує srcset із дескрипторами ширини", () => {
    expect(shopifySrcSet(CDN, [240, 480])).toBe(
      "https://cdn.shopify.com/s/files/1/iphone.png?v=1&width=240 240w, " +
        "https://cdn.shopify.com/s/files/1/iphone.png?v=1&width=480 480w",
    );
  });

  it("повертає undefined для сторонніх адрес", () => {
    expect(shopifySrcSet("https://example.com/a.png", [240, 480])).toBeUndefined();
  });
});
