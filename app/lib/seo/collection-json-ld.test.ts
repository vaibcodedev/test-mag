import { describe, expect, it } from "vitest";

import type { ProductCardData } from "~/components/product/product-card";

import {
  catalogBreadcrumbJsonLd,
  catalogCrumbs,
  collectionCrumbs,
  collectionItemListJsonLd,
} from "./collection-json-ld";

const ORIGIN = "https://sad.example";
const COLLECTION = { handle: "iphone", title: "iPhone" };

const PRODUCTS: ProductCardData[] = [
  {
    handle: "iphone-17-pro",
    title: "iPhone 17 Pro 256 ГБ",
    image: { url: "https://cdn.shopify.com/iphone.png" },
    price: { amount: "64999", currencyCode: "UAH" },
    availableForSale: true,
  },
  {
    handle: "iphone-17",
    title: "iPhone 17 128 ГБ",
    image: null,
    price: { amount: "44999", currencyCode: "UAH" },
    availableForSale: true,
  },
];

describe("крихти каталогу", () => {
  it("Головна → Каталог → колекція", () => {
    expect(catalogCrumbs().map((crumb) => crumb.to)).toEqual(["/", "/collections"]);
    expect(collectionCrumbs(COLLECTION)).toEqual([
      { title: "Головна", to: "/" },
      { title: "Каталог", to: "/collections" },
      { title: "iPhone", to: "/collections/iphone" },
    ]);
  });

  it("BreadcrumbList має позиції та абсолютні адреси", () => {
    const jsonLd = catalogBreadcrumbJsonLd(collectionCrumbs(COLLECTION), `${ORIGIN}/`);

    expect(jsonLd["@type"]).toBe("BreadcrumbList");
    expect(jsonLd.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Головна", item: `${ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: "Каталог", item: `${ORIGIN}/collections` },
      { "@type": "ListItem", position: 3, name: "iPhone", item: `${ORIGIN}/collections/iphone` },
    ]);
  });
});

describe("ItemList колекції", () => {
  it("перелічує видимі товари з адресами сторінок", () => {
    const jsonLd = collectionItemListJsonLd(COLLECTION, PRODUCTS, ORIGIN);

    expect(jsonLd["@type"]).toBe("ItemList");
    expect(jsonLd.name).toBe("iPhone");
    expect(jsonLd.url).toBe(`${ORIGIN}/collections/iphone`);
    expect(jsonLd.numberOfItems).toBe(2);
    expect(jsonLd.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "iPhone 17 Pro 256 ГБ",
        url: `${ORIGIN}/products/iphone-17-pro`,
        image: "https://cdn.shopify.com/iphone.png",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "iPhone 17 128 ГБ",
        url: `${ORIGIN}/products/iphone-17`,
      },
    ]);
  });
});
