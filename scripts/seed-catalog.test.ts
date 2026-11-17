/**
 * Перевірки даних каталогу та маніфесту зображень.
 * Запуск: node --experimental-strip-types --test scripts/seed-catalog.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  COMPARE_CATEGORIES,
  compareCategoryOf,
  parseSpecs,
  specKeysOf,
} from "../app/lib/compare/spec-schema.ts";
import {
  buildProduct,
  CATEGORIES,
  colorValues,
  COLOR_OPTION,
  combinations,
  formatAmount,
  isSampleProduct,
  minPrice,
  PRODUCT_COUNT,
  PRODUCTS,
  productsInCollection,
  STORAGE_OPTION,
  validateCatalog,
  variantKey,
} from "./seed-catalog.ts";
import { BANNERS, COLLECTIONS, metaobjectEntries } from "./seed-data.ts";
import { IMAGE_MANIFEST, TEST_ONLY_LICENCE, type ImageManifest } from "./seed-images.ts";
import {
  creditsMarkdown,
  MAX_IMAGES_PER_PRODUCT,
  mediaToStrip,
  productMediaPlan,
  validateMedia,
  variantMediaAlt,
} from "./seed-media.ts";
import { SPECS, specsMetafieldValue } from "./seed-specs.ts";

const collection = (handle: string) => {
  const found = COLLECTIONS.find((item) => item.handle === handle);
  assert.ok(found, `колекція ${handle}`);
  return found;
};

test("у каталозі рівно сто товарів з унікальними handle", () => {
  assert.equal(PRODUCTS.length, PRODUCT_COUNT);
  assert.equal(PRODUCT_COUNT, 100);
  assert.equal(new Set(PRODUCTS.map((item) => item.handle)).size, 100);
  for (const item of PRODUCTS) assert.match(item.handle, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
});

test("дані каталогу проходять перевірку", () => {
  assert.deepEqual(validateCatalog(PRODUCTS, COLLECTIONS), []);
});

test("поєднання опцій кожного товару унікальні, і кожен варіант має ціну та артикул", () => {
  const skus = new Set<string>();
  for (const item of PRODUCTS) {
    const keys = item.variants.map((variant) => variantKey(variant.options));
    assert.equal(new Set(keys).size, keys.length, item.handle);
    const expected = item.options.reduce((count, option) => count * option.values.length, 1);
    assert.equal(item.variants.length, expected, item.handle);
    for (const variant of item.variants) {
      assert.ok(variant.price > 0, `${item.handle} ${variantKey(variant.options)}`);
      assert.ok(!skus.has(variant.sku), `артикул ${variant.sku} повторюється`);
      skus.add(variant.sku);
    }
  }
});

test("більше пам'яті — вища ціна", () => {
  for (const item of PRODUCTS) {
    const [first] = item.options;
    if (!first || first.values.length < 2) continue;
    if (!["Пам'ять", "Конфігурація"].includes(first.name)) continue;
    const rest = item.variants[0]?.options.slice(1) ?? [];
    const prices = first.values.map((value) => {
      const variant = item.variants.find(
        (candidate) => variantKey(candidate.options) === variantKey([value, ...rest]),
      );
      assert.ok(variant, item.handle);
      return variant.price;
    });
    for (let index = 1; index < prices.length; index += 1) {
      assert.ok((prices[index] ?? 0) > (prices[index - 1] ?? 0), item.handle);
    }
  }
});

test("кружечків кольору стільки ж, скільки значень опції «Колір»", () => {
  for (const item of PRODUCTS) {
    assert.equal(item.colorSwatches?.length ?? 0, colorValues(item).length, item.handle);
  }
  assert.ok(PRODUCTS.filter((item) => colorValues(item).length > 0).length >= 50);
});

test("кожна колекція непорожня, а добірки мають очікуваний розмір", () => {
  for (const item of COLLECTIONS) {
    assert.ok(productsInCollection(item).length > 0, item.handle);
  }
  assert.equal(COLLECTIONS.length, 11);
  const size = (handle: string) => productsInCollection(collection(handle)).length;
  assert.ok(size("accessories") > 24, "аксесуарів більше, ніж уміщує сторінка колекції");
  assert.ok(size("deals") >= 10 && size("deals") <= 14);
  assert.equal(size("hits"), 12);
  assert.equal(size("new"), 12);
  assert.equal(size("students"), 8);
  assert.equal(size("used"), PRODUCTS.filter((item) => item.used).length);
  assert.equal(size("used"), 12);
});

test("є товари без залишку: кілька варіантів і три товари цілком", () => {
  const soldOut = PRODUCTS.filter((item) => item.variants.every((variant) => variant.stock === 0));
  const partly = PRODUCTS.filter(
    (item) =>
      item.variants.some((variant) => variant.stock === 0) &&
      item.variants.some((variant) => variant.stock > 0),
  );
  assert.equal(soldOut.length, 3);
  assert.ok(partly.length >= 6 && partly.length <= 8);
});

test("вживана техніка має стан, ємність акумулятора й тег", () => {
  for (const item of PRODUCTS.filter((candidate) => candidate.used)) {
    assert.ok(item.tags.includes("used"), item.handle);
    assert.ok((item.used?.batteryHealth ?? 0) >= 80, item.handle);
  }
});

test("бейдж має приблизно чверть товарів", () => {
  const badges = PRODUCTS.filter((item) => item.badge).length;
  assert.ok(badges >= 20 && badges <= 30, String(badges));
});

test("buildProduct збирає варіанти з опцій, знижок і залишків", () => {
  const item = buildProduct({
    handle: "test-item",
    title: "Тест",
    category: "accessories",
    text: ["Перше речення.", "Друге."],
    specs: ["А", "Б"],
    options: [
      { name: "Довжина", values: [{ name: "1 м" }, { name: "2 м", add: 500 }] },
      { name: COLOR_OPTION, values: [{ name: "Білий", hex: "#ffffff" }] },
    ],
    price: 1000,
    was: 1200,
    wasOnly: "1 м",
    soldOut: [["2 м"]],
  });
  assert.deepEqual(
    item.variants.map((variant) => [
      variant.options,
      variant.price,
      variant.compareAtPrice,
      variant.stock > 0,
    ]),
    [
      [["1 м", "Білий"], 1000, 1200, true],
      [["2 м", "Білий"], 1500, undefined, false],
    ],
  );
  assert.deepEqual(item.colorSwatches, ["#ffffff"]);
  assert.equal(item.variants[1]?.sku, "TEST-ITEM-02");
  assert.match(item.descriptionHtml, /<li>А<\/li>/);
  assert.match(item.seoDescription, /Від 1 000 ₴/);
});

test("допоміжні функції", () => {
  assert.equal(formatAmount(64999), "64 999");
  assert.equal(formatAmount(999), "999");
  assert.deepEqual(combinations([["a", "b"], ["x"]]), [
    ["a", "x"],
    ["b", "x"],
  ]);
});

test("зразками Shopify вважаються лише сноуборди з відомими handle", () => {
  assert.ok(isSampleProduct({ handle: "the-minimal-snowboard", title: "The Minimal Snowboard" }));
  assert.ok(isSampleProduct({ handle: "gift-card", title: "Gift Card" }));
  assert.ok(!isSampleProduct({ handle: "gift-card", title: "Подарунковий сертифікат" }));
  assert.ok(!isSampleProduct({ handle: "iphone-17-pro", title: "iPhone 17 Pro" }));
  assert.ok(!isSampleProduct({ handle: "my-snowboard", title: "My Snowboard" }));
});

test("ціни банерів дорівнюють цінам їхніх товарів", () => {
  const entries = metaobjectEntries({ currency: "UAH", demoReviews: true });
  const banners = entries.filter((entry) => entry.type === "home_banner");
  assert.equal(banners.length, BANNERS.length);
  for (const banner of banners) {
    const reference = banner.fields.product;
    assert.ok(reference && typeof reference === "object");
    const product = PRODUCTS.find((item) => item.handle === reference.product);
    assert.ok(product, banner.handle);
    const price = JSON.parse(String(banner.fields.price)) as {
      amount: string;
      currency_code: string;
    };
    assert.equal(Number(price.amount), minPrice(product));
    assert.equal(price.currency_code, "UAH");
  }
});

test("демо-відгуки й оцінка Google вимикаються параметром", () => {
  const withReviews = metaobjectEntries({ currency: "UAH", demoReviews: true });
  const without = metaobjectEntries({ currency: "UAH", demoReviews: false });
  assert.ok(withReviews.some((entry) => entry.type === "review"));
  assert.ok(!without.some((entry) => entry.type === "review"));
  const info = without.find((entry) => entry.type === "store_info");
  assert.equal(info?.fields.google_rating, undefined);
  assert.ok(withReviews.find((entry) => entry.type === "store_info")?.fields.google_rating);
});

/* ------------------------------------------------------------------ */
/* Зображення                                                          */
/* ------------------------------------------------------------------ */

test("маніфест зображень узгоджений із каталогом", () => {
  assert.deepEqual(validateMedia(PRODUCTS, IMAGE_MANIFEST), []);
  const handles = new Set(PRODUCTS.map((item) => item.handle));
  for (const handle of Object.keys(IMAGE_MANIFEST.products)) {
    assert.ok(handles.has(handle), `у маніфесті є невідомий товар ${handle}`);
  }
});

test("кожен товар має фото, підписи не повторюються, зображень не більше ліміту", () => {
  for (const item of PRODUCTS) {
    const plan = productMediaPlan(item, IMAGE_MANIFEST);
    assert.ok(plan.length > 0, item.handle);
    assert.equal(plan[0]?.type, "IMAGE", item.handle);
    assert.ok(
      plan.filter((media) => media.type === "IMAGE").length <= MAX_IMAGES_PER_PRODUCT,
      item.handle,
    );
    assert.equal(new Set(plan.map((media) => media.alt)).size, plan.length, item.handle);
    const videos = plan.findIndex((media) => media.type !== "IMAGE");
    if (videos >= 0) assert.ok(plan.slice(videos).every((media) => media.type !== "IMAGE"));
  }
});

test("фото кольору призначається варіантам саме цього кольору", () => {
  for (const item of PRODUCTS) {
    const plan = productMediaPlan(item, IMAGE_MANIFEST);
    const mapped = IMAGE_MANIFEST.products[item.handle]?.colors ?? {};
    for (const [color, id] of Object.entries(mapped)) {
      const image = IMAGE_MANIFEST.images.find((candidate) => candidate.id === id);
      assert.equal(variantMediaAlt(plan, ["щось", color]), image?.alt, `${item.handle} ${color}`);
    }
    assert.equal(variantMediaAlt(plan, ["Default Title"]), null, item.handle);
  }
});

const SAMPLE_MANIFEST: ImageManifest = {
  images: [
    {
      id: "a",
      url: "https://example.com/a.jpg",
      alt: "Офіційне фото",
      source: "Apple",
      sourcePage: "https://example.com",
      author: "Apple Inc.",
      licence: TEST_ONLY_LICENCE,
    },
    {
      id: "b",
      url: "https://example.com/b.jpg",
      alt: "Вільне фото",
      source: "Unsplash",
      sourcePage: "https://example.com",
      author: "Автор",
      licence: "Unsplash License",
    },
  ],
  products: { "iphone-17": { gallery: ["a", "b"] }, "iphone-16": { gallery: ["a"] } },
};

test("--strip-test-images лишає вільні фото й прибирає лише тестові цього товару", () => {
  const seventeen = PRODUCTS.find((item) => item.handle === "iphone-17");
  const sixteen = PRODUCTS.find((item) => item.handle === "iphone-16");
  assert.ok(seventeen && sixteen);

  const stripped = productMediaPlan(seventeen, SAMPLE_MANIFEST, { stripTestImages: true });
  assert.deepEqual(
    stripped.map((media) => media.alt),
    ["Вільне фото"],
  );

  // Якщо після прибирання нічого не лишилося, товар отримує фото категорії.
  const fallback = productMediaPlan(sixteen, SAMPLE_MANIFEST, { stripTestImages: true });
  assert.equal(fallback.length, 1);
  assert.equal(fallback[0]?.testOnly, false);
  assert.match(fallback[0]?.url ?? "", /mock-shop/);

  const current = [
    { id: "1", alt: "Офіційне фото" },
    { id: "2", alt: "Вільне фото" },
    { id: "3", alt: "Фото власника" },
    { id: "4", alt: null },
  ];
  assert.deepEqual(
    mediaToStrip(seventeen, SAMPLE_MANIFEST, current).map((media) => media.id),
    ["1"],
  );
});

test("у справжньому маніфесті тестові зображення знаходяться за підписом", () => {
  const item = PRODUCTS.find((candidate) => candidate.handle === "iphone-17-pro");
  assert.ok(item);
  const plan = productMediaPlan(item, IMAGE_MANIFEST);
  const current = plan.map((media, index) => ({ id: String(index), alt: media.alt }));
  const strip = mediaToStrip(item, IMAGE_MANIFEST, current);
  assert.equal(strip.length, plan.filter((media) => media.testOnly).length);
  assert.ok(strip.length > 0);
});

test("кожен пристрій із п'яти категорій має характеристики, аксесуари — ні", () => {
  for (const item of PRODUCTS) {
    const category = compareCategoryOf(item.productType);
    if (category) assert.ok(SPECS[item.handle], `${item.handle}: немає характеристик`);
    else
      assert.equal(SPECS[item.handle], undefined, `${item.handle}: аксесуар із характеристиками`);
    assert.equal(specsMetafieldValue(item.handle) !== undefined, category !== null, item.handle);
  }
  const handles = new Set(PRODUCTS.map((item) => item.handle));
  for (const handle of Object.keys(SPECS)) assert.ok(handles.has(handle), `зайвий запис ${handle}`);
  assert.deepEqual(
    COMPARE_CATEGORIES.map((category) => category.productType).sort(),
    (["iphone", "mac", "ipad", "watch", "airpods"] as const)
      .map((key) => CATEGORIES[key].productType)
      .sort(),
  );
});

test("характеристики мають лише ключі своєї категорії, без порожніх і задовгих значень", () => {
  for (const item of PRODUCTS) {
    const category = compareCategoryOf(item.productType);
    const specs = SPECS[item.handle];
    if (!category || !specs) continue;
    const keys = specKeysOf(category);
    for (const [key, value] of Object.entries(specs)) {
      assert.ok(keys.includes(key), `${item.handle}: ключа ${key} немає у схемі ${category.key}`);
      assert.equal(typeof value, "string", `${item.handle}.${key}`);
      assert.equal(value, value.trim(), `${item.handle}.${key}: пробіли по краях`);
      assert.ok(value.length > 0, `${item.handle}.${key}: порожнє значення`);
      assert.ok(value.length <= 64, `${item.handle}.${key}: ${value.length} символів`);
      assert.doesNotMatch(value, /\d\.\d+ ?(″|мм|см|г|кг|год|ніт)/, `${item.handle}.${key}: кома`);
    }
    const filled = Object.keys(specs).length / keys.length;
    assert.ok(filled >= 0.6, `${item.handle}: заповнено ${Math.round(filled * 100)}% рядків`);
    assert.deepEqual(parseSpecs(specsMetafieldValue(item.handle)), specs, item.handle);
  }
});

test("пам'ять у характеристиках збігається з опцією «Пам'ять» товару", () => {
  for (const item of PRODUCTS) {
    const storage = item.options.find((option) => option.name === STORAGE_OPTION);
    if (!storage || !SPECS[item.handle]) continue;
    assert.equal(SPECS[item.handle]?.storage, storage.values.join(", "), item.handle);
  }
});

test("перелік джерел містить кожне зображення й попередження про фото Apple", () => {
  const text = creditsMarkdown(PRODUCTS, IMAGE_MANIFEST);
  for (const image of IMAGE_MANIFEST.images) assert.ok(text.includes(image.url), image.id);
  assert.match(text, /ЛИШЕ для тестового магазину/);
  assert.match(text, /apple-test-only/);
});
