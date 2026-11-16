import { describe, expect, it } from "vitest";

import {
  isColorOptionName,
  isHexColor,
  parseListMetafield,
  productColorSwatches,
  productGalleryImages,
  productMetaDescription,
  productMetaTitle,
  productVariantUrl,
  swatchKey,
  toProductDetails,
  type ProductPageData,
} from "./product";

const IMAGE_A = {
  id: "a",
  url: "https://cdn.shopify.com/a.png",
  altText: "A",
  width: 800,
  height: 800,
};
const IMAGE_B = {
  id: "b",
  url: "https://cdn.shopify.com/b.png",
  altText: "B",
  width: 800,
  height: 800,
};

function product(overrides: Partial<ProductPageData> = {}): ProductPageData {
  const base = {
    id: "gid://shopify/Product/1",
    handle: "iphone-17-pro",
    title: "iPhone 17 Pro",
    vendor: "Apple",
    description: "Смартфон з дисплеєм 6,3 дюйма.",
    descriptionHtml: "<p>Смартфон з дисплеєм 6,3 дюйма.</p>",
    availableForSale: true,
    requiresSellingPlan: false,
    encodedVariantExistence: null,
    encodedVariantAvailability: null,
    seo: { title: null, description: null },
    featuredImage: IMAGE_A,
    images: { nodes: [IMAGE_A, IMAGE_B] },
    priceRange: { minVariantPrice: { amount: "64999.0", currencyCode: "UAH" } },
    collections: { nodes: [{ handle: "iphone", title: "iPhone" }] },
    options: [
      {
        name: "Пам'ять",
        optionValues: [
          { name: "256 ГБ", firstSelectableVariant: null, swatch: null },
          { name: "512 ГБ", firstSelectableVariant: null, swatch: null },
        ],
      },
      {
        name: "Колір",
        optionValues: [
          { name: "Синій титан", firstSelectableVariant: null, swatch: null },
          { name: "Срібний", firstSelectableVariant: null, swatch: { color: "#E3E4E5" } },
        ],
      },
    ],
    selectedOrFirstAvailableVariant: null,
    adjacentVariants: [],
    badge: null,
    installmentMonths: null,
    shortSpecs: null,
    colorSwatches: null,
    conditionGrade: null,
    batteryHealth: null,
  };

  return { ...base, ...overrides } as ProductPageData;
}

describe("parseListMetafield", () => {
  it("читає JSON-список і прибирає порожні значення", () => {
    expect(parseListMetafield('["Дисплей: 6,3″", " Face ID ", ""]')).toEqual([
      "Дисплей: 6,3″",
      "Face ID",
    ]);
  });

  it("розбиває звичайний текст за рядками", () => {
    expect(parseListMetafield("A18 Pro\nFace ID")).toEqual(["A18 Pro", "Face ID"]);
  });

  it("повертає порожній список без значення", () => {
    expect(parseListMetafield(null)).toEqual([]);
    expect(parseListMetafield("")).toEqual([]);
  });
});

describe("isHexColor", () => {
  it("приймає лише hex-кольори", () => {
    expect(isHexColor("#3c4a5e")).toBe(true);
    expect(isHexColor("#FFF")).toBe(true);
    expect(isHexColor("red")).toBe(false);
    expect(isHexColor("#12345")).toBe(false);
    expect(isHexColor("url(javascript:alert(1))")).toBe(false);
    expect(isHexColor(null)).toBe(false);
  });
});

describe("isColorOptionName", () => {
  it("розпізнає опцію кольору різними мовами", () => {
    expect(isColorOptionName("Колір")).toBe(true);
    expect(isColorOptionName("Colour")).toBe(true);
    expect(isColorOptionName("Color")).toBe(true);
    expect(isColorOptionName("Пам'ять")).toBe(false);
  });
});

describe("toProductDetails", () => {
  it("на магазині без метаполів усе порожнє", () => {
    expect(toProductDetails(product())).toEqual({
      badge: null,
      installmentMonths: null,
      shortSpecs: [],
      used: null,
      rating: null,
      collection: { handle: "iphone", title: "iPhone" },
    });
  });

  it("читає метаполя custom.*", () => {
    const details = toProductDetails(
      product({
        badge: { value: "Хіт" },
        installmentMonths: { value: "24" },
        shortSpecs: { value: '["A18 Pro","Face ID"]' },
        conditionGrade: { value: "Відмінний" },
        batteryHealth: { value: "91" },
        collections: { nodes: [] },
      }),
    );

    expect(details).toEqual({
      badge: "Хіт",
      installmentMonths: 24,
      shortSpecs: ["A18 Pro", "Face ID"],
      used: { grade: "Відмінний", batteryHealth: 91 },
      rating: null,
      collection: null,
    });
  });

  it("ігнорує невідомі значення бейджа та стану", () => {
    const details = toProductDetails(
      product({ badge: { value: "Sale" }, conditionGrade: { value: "Used" } }),
    );

    expect(details.badge).toBeNull();
    expect(details.used).toBeNull();
  });
});

describe("productColorSwatches", () => {
  it("бере swatch опції, а без нього — custom.color_swatches за порядком", () => {
    const swatches = productColorSwatches(
      product({ colorSwatches: { value: '["#3c4a5e","#000000"]' } }),
    );

    expect(swatches.get(swatchKey("Колір", "Синій титан"))).toBe("#3c4a5e");
    expect(swatches.get(swatchKey("Колір", "Срібний"))).toBe("#E3E4E5");
    expect(swatches.has(swatchKey("Пам'ять", "256 ГБ"))).toBe(false);
  });

  it("відкидає значення, які не є hex-кольором", () => {
    const swatches = productColorSwatches(product({ colorSwatches: { value: '["blue"]' } }));

    expect(swatches.has(swatchKey("Колір", "Синій титан"))).toBe(false);
  });
});

describe("productGalleryImages", () => {
  it("ставить фото вибраного варіанта першим і не повторює фото", () => {
    expect(productGalleryImages(product(), { image: IMAGE_B }).map((image) => image.url)).toEqual([
      IMAGE_B.url,
      IMAGE_A.url,
    ]);
  });

  it("без варіанта починає з головного фото", () => {
    expect(productGalleryImages(product(), null).map((image) => image.url)).toEqual([
      IMAGE_A.url,
      IMAGE_B.url,
    ]);
  });

  it("повертає порожній список, коли фото немає", () => {
    expect(productGalleryImages(product({ featuredImage: null, images: { nodes: [] } }))).toEqual(
      [],
    );
  });
});

describe("productVariantUrl", () => {
  const target = { handle: "iphone-17-pro", options: [{ name: "Storage" }, { name: "Color" }] };

  it("записує опції в параметри й зберігає сторонні параметри", () => {
    const url = productVariantUrl(
      target,
      [
        { name: "Storage", value: "256 GB" },
        { name: "Color", value: "Blue" },
      ],
      undefined,
      new URLSearchParams("ref=campaign&Color=Silver"),
    );
    const parsed = new URL(url, "https://sad.example");

    expect(parsed.pathname).toBe("/products/iphone-17-pro");
    expect(parsed.searchParams.get("ref")).toBe("campaign");
    expect(parsed.searchParams.get("Storage")).toBe("256 GB");
    expect(parsed.searchParams.getAll("Color")).toEqual(["Blue"]);
  });

  it("без вибраних опцій дає чисту адресу товару", () => {
    expect(productVariantUrl(target, [])).toBe("/products/iphone-17-pro");
  });

  it("для об'єднаних товарів підставляє handle іншого товару", () => {
    expect(productVariantUrl(target, [], "iphone-17")).toBe("/products/iphone-17");
  });
});

describe("productMetaTitle", () => {
  it("додає уточнення про магазин, доки вміщається в 60 символів", () => {
    expect(productMetaTitle("iPhone 17 Pro")).toBe("iPhone 17 Pro — купити у Вінниці | Сад");
    expect(productMetaTitle("MacBook Air 13 M4 16/256 ГБ, темна ніч, 2025")).toBe(
      "MacBook Air 13 M4 16/256 ГБ, темна ніч, 2025 — купити | Сад",
    );
  });

  it("ніколи не перевищує 60 символів", () => {
    const title = productMetaTitle(
      "Навушники Apple AirPods Max USB-C з активним шумопоглинанням, темна ніч",
    );

    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.endsWith("…")).toBe(true);
  });
});

describe("productMetaDescription", () => {
  it("до короткого опису додає умови магазину", () => {
    expect(productMetaDescription(product())).toBe(
      "Смартфон з дисплеєм 6,3 дюйма. Доставка по Україні завтра, оплата частинами, гарантія 12 місяців.",
    );
  });

  it("віддає перевагу SEO-опису та обрізає довгий текст", () => {
    const description = productMetaDescription(
      product({ seo: { title: null, description: "Дуже докладний опис товару. ".repeat(12) } }),
    );

    expect(description.startsWith("Дуже докладний опис товару.")).toBe(true);
    expect(description.length).toBeLessThanOrEqual(155);
    expect(description.endsWith("…")).toBe(true);
  });

  it("без опису складає текст із назви", () => {
    expect(productMetaDescription(product({ description: "" }))).toContain(
      "Купити iPhone 17 Pro у «Сад».",
    );
  });
});
