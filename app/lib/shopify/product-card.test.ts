import { describe, expect, it } from "vitest";

import { toCardColors, toCardPricing, toProductCard, type ProductCardFields } from "./product-card";

const IMAGE = { url: "https://cdn.shopify.com/phone.png", altText: null, width: 928, height: 1152 };

/** Товар у формі фрагмента ProductCardFields, як його віддає Storefront API. */
function product(overrides: Partial<ProductCardFields> = {}): ProductCardFields {
  return {
    id: "gid://shopify/Product/1",
    handle: "one-smartphone",
    title: "One Smartphone",
    availableForSale: true,
    productType: "",
    featuredImage: IMAGE,
    selectedOrFirstAvailableVariant: variant(),
    priceRange: { minVariantPrice: money("64999.0"), maxVariantPrice: money("64999.0") },
    badge: null,
    installmentMonths: null,
    conditionGrade: null,
    batteryHealth: null,
    cardColorSwatches: null,
    cardOptions: [],
    ...overrides,
  } as ProductCardFields;
}

type CardVariant = NonNullable<ProductCardFields["selectedOrFirstAvailableVariant"]>;

function money(amount: string) {
  return { amount, currencyCode: "UAH" as const };
}

function variant(overrides: Partial<CardVariant> = {}): CardVariant {
  return {
    id: "gid://shopify/ProductVariant/11",
    availableForSale: true,
    price: money("64999.0"),
    compareAtPrice: null,
    ...overrides,
  } as CardVariant;
}

type CardOption = ProductCardFields["cardOptions"][number];

function option(name: string, values: (string | [string, string | null])[]): CardOption {
  return {
    name,
    optionValues: values.map((value) => {
      const [valueName, color] = typeof value === "string" ? [value, null] : value;
      return { name: valueName, swatch: color === null ? null : { color } };
    }),
  } as CardOption;
}

describe("toProductCard", () => {
  it("тип товару визначає категорію порівняння; аксесуари її не мають", () => {
    expect(toProductCard(product({ productType: "Смартфони" })).compareCategory).toBe("iphone");
    expect(toProductCard(product({ productType: "Навушники" })).compareCategory).toBe("airpods");
    expect(toProductCard(product({ productType: "Аксесуари" })).compareCategory).toBeNull();
  });

  it("збирає картку з товару без метаполів (mock.shop)", () => {
    expect(toProductCard(product())).toEqual({
      handle: "one-smartphone",
      variantId: "gid://shopify/ProductVariant/11",
      title: "One Smartphone",
      image: IMAGE,
      price: { amount: "64999.0", currencyCode: "UAH" },
      compareAtPrice: null,
      priceFrom: false,
      availableForSale: true,
      badge: null,
      installmentMonths: null,
      compareCategory: null,
      used: null,
      rating: null,
      delivery: "доставимо завтра",
    });
  });

  it("показує стару ціну варіанта лише тоді, коли вона більша за його ціну", () => {
    const sale = toProductCard(
      product({
        selectedOrFirstAvailableVariant: variant({ compareAtPrice: money("72999.0") }),
      }),
    );

    expect(sale.compareAtPrice).toEqual({ amount: "72999.0", currencyCode: "UAH" });
    expect(toProductCard(product()).compareAtPrice).toBeNull();
    expect(
      toProductCard(
        product({ selectedOrFirstAvailableVariant: variant({ compareAtPrice: money("64999.0") }) }),
      ).compareAtPrice,
    ).toBeNull();
  });

  it("читає бейдж і кількість платежів, а невідомий бейдж відкидає", () => {
    const card = toProductCard(
      product({ badge: { value: "Хіт" }, installmentMonths: { value: "10" } }),
    );

    expect(card.badge).toBe("Хіт");
    expect(card.installmentMonths).toBe(10);
    expect(toProductCard(product({ badge: { value: "Sale" } })).badge).toBeNull();
    expect(
      toProductCard(product({ installmentMonths: { value: "багато" } })).installmentMonths,
    ).toBeNull();
  });

  it("позначає вживаний пристрій за станом і читає ємність акумулятора", () => {
    const card = toProductCard(
      product({ conditionGrade: { value: "Відмінний" }, batteryHealth: { value: "89" } }),
    );

    expect(card.used).toEqual({ grade: "Відмінний", batteryHealth: 89 });
    expect(toProductCard(product({ conditionGrade: { value: "Used" } })).used).toBeNull();
    expect(toProductCard(product({ batteryHealth: { value: "89" } })).used).toBeNull();
  });

  it("товар не в наявності: без підпису про доставку й без варіанта, якщо їх немає", () => {
    const card = toProductCard(
      product({ availableForSale: false, selectedOrFirstAvailableVariant: null }),
    );

    expect(card.delivery).toBeNull();
    expect(card.variantId).toBeNull();
  });

  it("додає кольори з custom.color_swatches за порядком значень опції «Колір»", () => {
    const card = toProductCard(
      product({
        cardOptions: [
          option("Storage", ["128 GB", "256 GB"]),
          option("Colour", ["Graphite", "Silver"]),
        ],
        cardColorSwatches: { value: '["#41444b","#c7c9cc"]' },
      }),
    );

    expect(card.colors).toEqual([
      { name: "Graphite", hex: "#41444b" },
      { name: "Silver", hex: "#c7c9cc" },
    ]);
  });

  it("не додає поле colors, коли кольорів немає", () => {
    expect(toProductCard(product()).colors).toBeUndefined();
    expect(
      toProductCard(product({ cardColorSwatches: { value: '["#41444b"]' } })).colors,
    ).toBeUndefined();
  });

  it("працює з відповіддю без полів кольору (старі запити й фікстури)", () => {
    const { cardOptions: _options, cardColorSwatches: _swatches, ...legacy } = product();

    expect(toProductCard(legacy as ProductCardFields).colors).toBeUndefined();
  });
});

describe("toCardPricing", () => {
  it("ціна, стара ціна й варіант беруться з одного варіанта", () => {
    expect(
      toCardPricing({
        priceRange: { minVariantPrice: money("900.0"), maxVariantPrice: money("900.0") },
        selectedOrFirstAvailableVariant: variant({
          id: "gid://shopify/ProductVariant/7",
          price: money("900.0"),
          compareAtPrice: money("1000.0"),
        }),
      }),
    ).toEqual({
      variantId: "gid://shopify/ProductVariant/7",
      price: money("900.0"),
      compareAtPrice: money("1000.0"),
      priceFrom: false,
    });
  });

  it("варіанти з різними цінами: «від» + найменша ціна, і купити можна лише на сторінці товару", () => {
    expect(
      toCardPricing({
        priceRange: { minVariantPrice: money("900.0"), maxVariantPrice: money("1400.0") },
        // Перший доступний варіант дорожчий за найдешевший: його ціну показувати не можна.
        selectedOrFirstAvailableVariant: variant({
          price: money("1400.0"),
          compareAtPrice: money("1500.0"),
        }),
      }),
    ).toEqual({ variantId: null, price: money("900.0"), compareAtPrice: null, priceFrom: true });
  });

  it("без варіанта у відповіді показує найменшу ціну й веде на сторінку товару", () => {
    expect(
      toCardPricing({
        priceRange: { minVariantPrice: money("900.0"), maxVariantPrice: money("900.0") },
        selectedOrFirstAvailableVariant: null,
      }),
    ).toEqual({ variantId: null, price: money("900.0"), compareAtPrice: null, priceFrom: false });
  });

  it("варіант не в наявності не потрапляє в кошик із картки", () => {
    expect(
      toCardPricing({
        priceRange: { minVariantPrice: money("900.0"), maxVariantPrice: money("900.0") },
        selectedOrFirstAvailableVariant: variant({
          availableForSale: false,
          price: money("900.0"),
        }),
      }).variantId,
    ).toBeNull();
  });
});

describe("toCardColors", () => {
  it("розпізнає опцію кольору українською та англійською", () => {
    for (const name of ["Колір", "Color", "Colour", "колір корпусу"]) {
      expect(
        toCardColors({
          cardOptions: [option(name, ["Синій"])],
          cardColorSwatches: { value: '["#32374a"]' },
        }),
      ).toEqual([{ name: "Синій", hex: "#32374a" }]);
    }
  });

  it("swatch значення опції важливіший за метаполе", () => {
    const colors = toCardColors({
      cardOptions: [option("Колір", [["Сріблястий", "#E3E4E5"], "Темно-синій"])],
      cardColorSwatches: { value: '["#000000","#32374a"]' },
    });

    expect(colors).toEqual([
      { name: "Сріблястий", hex: "#E3E4E5" },
      { name: "Темно-синій", hex: "#32374a" },
    ]);
  });

  it("пропускає значення без кольору або з некоректним hex", () => {
    const colors = toCardColors({
      cardOptions: [option("Колір", ["Прозорий", "Синій", "Червоний", "Зелений"])],
      cardColorSwatches: { value: '["", "#32374a", "red", "url(javascript:alert(1))"]' },
    });

    expect(colors).toEqual([{ name: "Синій", hex: "#32374a" }]);
  });

  it("повертає порожній список, якщо опції кольору немає або метаполе зіпсоване", () => {
    expect(toCardColors({})).toEqual([]);
    expect(
      toCardColors({
        cardOptions: [option("Storage", ["128 GB"])],
        cardColorSwatches: { value: '["#41444b"]' },
      }),
    ).toEqual([]);
    for (const value of ["не JSON", '{"hex":"#41444b"}', "[1, null, {}]", ""]) {
      expect(
        toCardColors({ cardOptions: [option("Колір", ["Графіт"])], cardColorSwatches: { value } }),
      ).toEqual([]);
    }
  });

  it("опція «Title» зі значенням «Default Title» кольорів не дає", () => {
    expect(
      toCardColors({
        cardOptions: [option("Title", ["Default Title"])],
        cardColorSwatches: { value: '["#41444b"]' },
      }),
    ).toEqual([]);
  });
});
