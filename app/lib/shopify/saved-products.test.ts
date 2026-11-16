import { afterEach, describe, expect, it, vi } from "vitest";

import {
  loadSavedProducts,
  parseHandlesParam,
  parseShortSpecs,
  toSavedProduct,
  type SavedProductFields,
} from "./saved-products";

function node(handle: string, overrides: Partial<SavedProductFields> = {}): SavedProductFields {
  return {
    id: `gid://shopify/Product/${handle}`,
    handle,
    title: `Товар ${handle}`,
    availableForSale: true,
    featuredImage: { url: "https://cdn.shopify.com/a.png", altText: null, width: 800, height: 800 },
    selectedOrFirstAvailableVariant: {
      id: `gid://shopify/ProductVariant/${handle}`,
      availableForSale: true,
      price: { amount: "64999.0", currencyCode: "UAH" },
      compareAtPrice: null,
    },
    priceRange: {
      minVariantPrice: { amount: "64999.0", currencyCode: "UAH" },
      maxVariantPrice: { amount: "64999.0", currencyCode: "UAH" },
    },
    badge: null,
    installmentMonths: null,
    conditionGrade: null,
    batteryHealth: null,
    vendor: "Apple",
    productType: "Смартфон",
    options: [
      { name: "Пам'ять", optionValues: [{ name: "256 ГБ" }, { name: "512 ГБ" }] },
      { name: "Title", optionValues: [{ name: "Default Title" }] },
    ],
    shortSpecs: { value: '["Дисплей 6,3 дюйма","Чип A19 Pro"]' },
    ...overrides,
  } as SavedProductFields;
}

/** Клієнт, який «знає» лише передані товари та повертає їх у слотах p0…pN. */
function fakeClient(known: string[]) {
  const graphql = vi.fn(
    async (_query: unknown, options: { variables: Record<string, unknown> }) => {
      const data: Record<string, unknown> = {};
      for (const [name, value] of Object.entries(options.variables)) {
        if (!name.startsWith("h")) continue;
        const handle = String(value);
        data[`p${name.slice(1)}`] = known.includes(handle) ? node(handle) : null;
      }
      return { data };
    },
  );
  return { graphql } as unknown as Parameters<typeof loadSavedProducts>[0] & {
    graphql: typeof graphql;
  };
}

describe("parseHandlesParam", () => {
  it("розбирає перелік через кому, зливає повтори й прибирає пробіли", () => {
    expect(parseHandlesParam("a, b,a,,c-1_x")).toEqual({ ok: true, handles: ["a", "b", "c-1_x"] });
  });

  it("приймає кириличні handle", () => {
    expect(parseHandlesParam("чохол-iphone")).toEqual({ ok: true, handles: ["чохол-iphone"] });
  });

  it("вимагає хоча б один handle", () => {
    expect(parseHandlesParam(null).ok).toBe(false);
    expect(parseHandlesParam(" , ").ok).toBe(false);
  });

  it("приймає 24 handle і відхиляє 25", () => {
    const handles = Array.from({ length: 25 }, (_, index) => `p-${index}`);

    expect(parseHandlesParam(handles.slice(0, 24).join(",")).ok).toBe(true);
    expect(parseHandlesParam(handles.join(","))).toEqual({
      ok: false,
      error: "Забагато товарів: за один запит можна отримати не більше 24.",
    });
  });

  it("відхиляє символи поза набором handle", () => {
    for (const value of ["a b", 'a"){id}', "a/b", "a.b", "<script>", "a{b}"]) {
      expect(parseHandlesParam(value).ok).toBe(false);
    }
  });
});

describe("parseShortSpecs", () => {
  it("читає список із JSON", () => {
    expect(parseShortSpecs('["A", " B ", "", 3]')).toEqual(["A", "B", "3"]);
  });

  it("читає звичайний текст порядково", () => {
    expect(parseShortSpecs("Дисплей 6,3\nЧип A19")).toEqual(["Дисплей 6,3", "Чип A19"]);
  });

  it("без значення повертає порожній список", () => {
    expect(parseShortSpecs(null)).toEqual([]);
    expect(parseShortSpecs("")).toEqual([]);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("toSavedProduct", () => {
  it("збирає дані картки, опції без службової Title та короткі характеристики", () => {
    const product = toSavedProduct(node("iphone-17"));

    expect(product).toMatchObject({
      handle: "iphone-17",
      variantId: "gid://shopify/ProductVariant/iphone-17",
      title: "Товар iphone-17",
      price: { amount: "64999.0", currencyCode: "UAH" },
      compareAtPrice: null,
      availableForSale: true,
      vendor: "Apple",
      productType: "Смартфон",
      options: [{ name: "Пам'ять", values: ["256 ГБ", "512 ГБ"] }],
      shortSpecs: ["Дисплей 6,3 дюйма", "Чип A19 Pro"],
    });
  });

  it("порожні vendor, тип і метаполя стають null та порожніми списками", () => {
    const product = toSavedProduct(
      node("case", { vendor: " ", productType: "", options: [], shortSpecs: null }),
    );

    expect(product).toMatchObject({ vendor: null, productType: null, options: [], shortSpecs: [] });
  });

  it("передає стан уживаного пристрою", () => {
    const product = toSavedProduct(
      node("used", { conditionGrade: { value: "Відмінний" }, batteryHealth: { value: "91" } }),
    );

    expect(product.used).toEqual({ grade: "Відмінний", batteryHealth: 91 });
  });
});

describe("loadSavedProducts", () => {
  it("вмикає по слоту на кожен handle і повертає товари в порядку списку без зниклих", async () => {
    const client = fakeClient(["a", "c"]);

    const products = await loadSavedProducts(client, ["c", "gone", "a"]);

    expect(products.map((product) => product.handle)).toEqual(["c", "a"]);
    expect(client.graphql).toHaveBeenCalledOnce();
    expect(client.graphql.mock.calls[0]?.[1].variables).toEqual({
      h0: "c",
      i0: true,
      h1: "gone",
      i1: true,
      h2: "a",
      i2: true,
    });
  });

  it("24 handle ділить на два запити по 12 і зберігає порядок", async () => {
    const handles = Array.from({ length: 24 }, (_, index) => `p-${index}`);
    const client = fakeClient(handles);

    const products = await loadSavedProducts(client, handles);

    expect(client.graphql).toHaveBeenCalledTimes(2);
    expect(products.map((product) => product.handle)).toEqual(handles);
  });

  it("для порожнього списку не ходить в API", async () => {
    const client = fakeClient([]);

    expect(await loadSavedProducts(client, [])).toEqual([]);
    expect(client.graphql).not.toHaveBeenCalled();
  });

  it("кидає помилку, коли API відповів без даних, і не розкриває текст магазину", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = {
      graphql: vi.fn(async () => ({ data: undefined, errors: [{ message: "Throttled" }] })),
    } as unknown as Parameters<typeof loadSavedProducts>[0];

    const error = await loadSavedProducts(client, ["a"]).catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toContain("Throttled");
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Throttled"));
  });

  it("часткова відповідь із помилкою — теж збій: інакше клієнт прибрав би товар зі списку", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    // Слот p1 не прочитався й дорівнює null, хоча товар у магазині є.
    const client = {
      graphql: vi.fn(async () => ({
        data: { p0: node("a"), p1: null },
        errors: [{ message: "Internal error", path: ["p1"] }],
      })),
    } as unknown as Parameters<typeof loadSavedProducts>[0];

    await expect(loadSavedProducts(client, ["a", "b"])).rejects.toThrow();
  });

  it("не кешує запит: ціна й наявність мають бути свіжими", async () => {
    const client = fakeClient(["a"]);

    await loadSavedProducts(client, ["a"]);

    expect(client.graphql.mock.calls[0]?.[1]).not.toHaveProperty("cache");
  });
});
