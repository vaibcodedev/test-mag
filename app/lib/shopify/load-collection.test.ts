import { afterEach, describe, expect, it, vi } from "vitest";

import { loadCollectionPage, loadCollectionsPage } from "./load-collection";

type Variables = Record<string, unknown>;

function product(handle: string, price: string) {
  return {
    id: `gid://shopify/Product/${handle}`,
    handle,
    title: handle,
    availableForSale: true,
    featuredImage: null,
    selectedOrFirstAvailableVariant: {
      id: `gid://shopify/ProductVariant/${handle}`,
      availableForSale: true,
      price: { amount: price, currencyCode: "UAH" },
      compareAtPrice: null,
    },
    priceRange: {
      minVariantPrice: { amount: price, currencyCode: "UAH" },
      maxVariantPrice: { amount: price, currencyCode: "UAH" },
    },
    badge: null,
    installmentMonths: null,
    conditionGrade: null,
    batteryHealth: null,
  };
}

function collectionData(overrides: Record<string, unknown> = {}) {
  return {
    shop: { paymentSettings: { currencyCode: "UAH" } },
    collection: {
      id: "gid://shopify/Collection/1",
      handle: "iphone",
      title: "iPhone",
      description: "Опис",
      seo: { title: null, description: null },
      image: null,
      products: {
        filters: [],
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startCursor: "start",
          endCursor: "end",
        },
        nodes: [product("iphone-17", "44999.0"), product("iphone-17-pro", "64999.0")],
      },
      priceCeiling: { nodes: [{ priceRange: { maxVariantPrice: { amount: "119999.0" } } }] },
      ...overrides,
    },
  };
}

const COUNT_OF_THREE = {
  collection: {
    products: { nodes: [{ id: "1" }, { id: "2" }, { id: "3" }], pageInfo: { hasNextPage: false } },
  },
};

/**
 * Клієнт-заглушка: запам'ятовує змінні запитів і повертає готові дані.
 * Запит-лічильник впізнаємо за назвою операції.
 */
function fakeClient(
  data: unknown,
  count: unknown = COUNT_OF_THREE,
  errors?: { page?: { message: string }[]; count?: { message: string }[] },
) {
  const graphql = vi.fn(
    async (query: unknown, _options?: { variables?: Variables; cache?: unknown }) =>
      String(query).includes("CollectionProductCount")
        ? { data: count, ...(errors?.count ? { errors: errors.count } : {}) }
        : { data, ...(errors?.page ? { errors: errors.page } : {}) },
  );
  const variablesOf = (operation: string) =>
    graphql.mock.calls.find(([query]) => String(query).includes(`query ${operation}`))?.[1]
      ?.variables ?? {};
  return {
    storefrontClient: { graphql } as never,
    graphql,
    variables: () => variablesOf("CollectionPage"),
    countVariables: () => variablesOf("CollectionProductCount"),
  };
}

const request = (search = "") => new Request(`https://sad.example/collections/iphone${search}`);

const thrownBy = (promise: Promise<unknown>) => promise.catch((thrown: unknown) => thrown);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadCollectionPage", () => {
  it("чиста адреса: перша сторінка, популярні, без фільтрів", async () => {
    const { storefrontClient, variables } = fakeClient(collectionData());

    const data = await loadCollectionPage({
      storefrontClient,
      handle: "iphone",
      request: request(),
    });

    expect(variables()).toMatchObject({ handle: "iphone", first: 24, sortKey: "COLLECTION_DEFAULT" });
    expect(variables().filters).toBeUndefined();
    expect(variables().after).toBeUndefined();
    expect(data.products.map((item) => item.handle)).toEqual(["iphone-17", "iphone-17-pro"]);
    expect(data.totalCount).toBe(3);
    expect(data.currencyCode).toBe("UAH");
    expect(data.indexable).toBe(true);
    expect(data.dataSearch).toBe("");
    expect(data.origin).toBe("https://sad.example");
  });

  it("фільтри, сортування й курсор з адреси потрапляють у змінні запиту", async () => {
    const { storefrontClient, variables, countVariables } = fakeClient(collectionData());
    const search =
      "?filter.v.price.gte=30000&filter.v.price.lte=70000&filter.v.availability=1&sort_by=price-descending&after=cursor-1";

    const data = await loadCollectionPage({
      storefrontClient,
      handle: "iphone",
      request: request(search),
    });

    expect(variables()).toMatchObject({
      first: 24,
      after: "cursor-1",
      sortKey: "PRICE",
      reverse: true,
      filters: [{ price: { min: 30000, max: 70000 } }, { available: true }],
    });
    expect(data.indexable).toBe(false);
    expect(data.dataSearch).toBe(search.slice(1));
    // Лічильник рахує з тими самими фільтрами, але без сортування й курсора.
    expect(countVariables()).toEqual({
      handle: "iphone",
      first: 250,
      filters: [{ price: { min: 30000, max: 70000 } }, { available: true }],
    });
  });

  it("?before= просить попередню сторінку", async () => {
    const { storefrontClient, variables } = fakeClient(collectionData());

    await loadCollectionPage({
      storefrontClient,
      handle: "iphone",
      request: request("?before=cursor-0"),
    });

    expect(variables()).toMatchObject({ last: 24, before: "cursor-0" });
    expect(variables().first).toBeUndefined();
  });

  it("невідомий handle → 404", async () => {
    const { storefrontClient } = fakeClient({
      shop: { paymentSettings: { currencyCode: "UAH" } },
      collection: null,
    });

    const error: unknown = await loadCollectionPage({
      storefrontClient,
      handle: "nope",
      request: request(),
    }).catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(404);
  });

  it("без фільтрів від магазину додає фільтр ціни з межею за найдорожчим товаром", async () => {
    const { storefrontClient } = fakeClient(collectionData());

    const data = await loadCollectionPage({
      storefrontClient,
      handle: "iphone",
      request: request(),
    });

    expect(data.priceCeiling).toBe(120000);
    expect(data.filters.map((filter) => filter.type)).toEqual(["PRICE_RANGE"]);
  });

  it("фільтри магазину віддає як є", async () => {
    const filters = [
      {
        id: "filter.v.price",
        label: "Ціна",
        type: "PRICE_RANGE",
        presentation: null,
        values: [
          {
            id: "filter.v.price",
            label: "Ціна",
            count: 3,
            input: '{"price":{"min":0,"max":64999.0}}',
            swatch: null,
          },
        ],
      },
      {
        id: "filter.v.option.color",
        label: "Колір",
        type: "LIST",
        presentation: "SWATCH",
        values: [
          {
            id: "black",
            label: "Чорний",
            count: 2,
            input: '{"variantOption":{"name":"Колір","value":"Чорний"}}',
            swatch: { color: "#000000", image: null },
          },
        ],
      },
    ];
    const base = collectionData();
    const { storefrontClient } = fakeClient(
      collectionData({ products: { ...base.collection.products, filters } }),
    );

    const data = await loadCollectionPage({
      storefrontClient,
      handle: "iphone",
      request: request(),
    });

    expect(data.filters.map((filter) => filter.label)).toEqual(["Ціна", "Колір"]);
    expect(data.filters[1]?.values[0]?.swatch?.color).toBe("#000000");
    expect(data.priceCeiling).toBe(65000);
  });

  it("коли товарів більше, ніж рахуємо, загальна кількість невідома", async () => {
    const { storefrontClient } = fakeClient(collectionData(), {
      collection: { products: { nodes: [{ id: "1" }], pageInfo: { hasNextPage: true } } },
    });

    const data = await loadCollectionPage({
      storefrontClient,
      handle: "iphone",
      request: request(),
    });

    expect(data.totalCount).toBeNull();
  });
});

describe("loadCollectionPage: помилки Storefront API", () => {
  const NO_COLLECTION = { shop: { paymentSettings: { currencyCode: "UAH" } }, collection: null };

  it("помилка GraphQL без колекції → 502, а не 404, і текст магазину не потрапляє у відповідь", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { storefrontClient } = fakeClient(NO_COLLECTION, COUNT_OF_THREE, {
      page: [{ message: "Internal error. Request ID: secret-123" }],
    });

    const error = await thrownBy(
      loadCollectionPage({ storefrontClient, handle: "iphone", request: request() }),
    );

    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(502);
    expect(await (error as Response).text()).not.toContain("secret-123");
    expect(log).toHaveBeenCalledWith(expect.stringContaining("secret-123"));
  });

  it("відповідь без даних і з помилками → 502", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { storefrontClient } = fakeClient(null, COUNT_OF_THREE, {
      page: [{ message: "Throttled" }],
    });

    const error = await thrownBy(
      loadCollectionPage({ storefrontClient, handle: "iphone", request: request() }),
    );

    expect((error as Response).status).toBe(502);
  });

  it("зіпсований курсор → перехід на першу сторінку з тими самими фільтрами", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { storefrontClient } = fakeClient(NO_COLLECTION, COUNT_OF_THREE, {
      page: [{ message: "invalid cursor" }],
    });

    const error = await thrownBy(
      loadCollectionPage({
        storefrontClient,
        handle: "iphone",
        request: request("?sort_by=price-ascending&after=garbage"),
      }),
    );

    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(302);
    expect((error as Response).headers.get("Location")).toBe(
      "/collections/iphone?sort_by=price-ascending",
    );
  });

  it("курсор в адресі без помилок і без колекції — звичайна 404", async () => {
    const { storefrontClient } = fakeClient(NO_COLLECTION);

    const error = await thrownBy(
      loadCollectionPage({ storefrontClient, handle: "nope", request: request("?after=abc") }),
    );

    expect((error as Response).status).toBe(404);
  });

  it("колекція є, а помилка в другорядному полі — сторінка працює, помилка в журналі", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { storefrontClient } = fakeClient(collectionData(), COUNT_OF_THREE, {
      page: [{ message: "Field error" }],
    });

    const data = await loadCollectionPage({
      storefrontClient,
      handle: "iphone",
      request: request(),
    });

    expect(data.products).toHaveLength(2);
    expect(log).toHaveBeenCalled();
  });

  it("лічильник не відповів (помилка або збій мережі) — сторінка без «із M»", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const failed = fakeClient(collectionData(), null, { count: [{ message: "Too complex" }] });
    expect(
      (
        await loadCollectionPage({
          storefrontClient: failed.storefrontClient,
          handle: "iphone",
          request: request(),
        })
      ).totalCount,
    ).toBeNull();

    const graphql = vi.fn(async (query: unknown) => {
      if (String(query).includes("CollectionProductCount")) throw new Error("network");
      return { data: collectionData() };
    });
    const data = await loadCollectionPage({
      storefrontClient: { graphql } as never,
      handle: "iphone",
      request: request(),
    });
    expect(data.totalCount).toBeNull();
    expect(data.products).toHaveLength(2);
  });

  it("запити колекції кешуються коротко", async () => {
    const { storefrontClient, graphql } = fakeClient(collectionData());

    await loadCollectionPage({ storefrontClient, handle: "iphone", request: request() });

    for (const [, options] of graphql.mock.calls) {
      expect(options?.cache).toMatchObject({ mode: "public", maxAge: 1 });
    }
  });
});

describe("loadCollectionsPage: помилки Storefront API", () => {
  it("відповідь без даних → 502", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { storefrontClient } = fakeClient(null, COUNT_OF_THREE, {
      page: [{ message: "Internal error" }],
    });

    const error = await thrownBy(
      loadCollectionsPage({
        storefrontClient,
        request: new Request("https://sad.example/collections"),
      }),
    );

    expect((error as Response).status).toBe(502);
  });
});

describe("loadCollectionsPage", () => {
  it("колекція без фото показує фото першого товару", async () => {
    const image = { url: "https://cdn.shopify.com/a.png", altText: null, width: 800, height: 600 };
    const { storefrontClient } = fakeClient({
      collections: {
        nodes: [
          {
            id: "1",
            handle: "iphone",
            title: "iPhone",
            description: "",
            image,
            products: { nodes: [] },
          },
          {
            id: "2",
            handle: "mac",
            title: "Mac",
            description: "Опис",
            image: null,
            products: {
              nodes: [{ featuredImage: { ...image, url: "https://cdn.shopify.com/b.png" } }],
            },
          },
          // Службова колекція Shopify у каталог не потрапляє.
          {
            id: "3",
            handle: "frontpage",
            title: "Home page",
            description: "",
            image: null,
            products: { nodes: [] },
          },
        ],
      },
    });

    const data = await loadCollectionsPage({
      storefrontClient,
      request: new Request("https://sad.example/collections"),
    });

    expect(data.collections.map((item) => [item.handle, item.image?.url])).toEqual([
      ["iphone", "https://cdn.shopify.com/a.png"],
      ["mac", "https://cdn.shopify.com/b.png"],
    ]);
    expect(data.origin).toBe("https://sad.example");
  });
});
