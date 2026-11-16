import { afterEach, describe, expect, it, vi } from "vitest";

import { loader } from "./api.saved-products";

type LoaderArgs = Parameters<typeof loader>[0];

const PRODUCT = {
  id: "gid://shopify/Product/1",
  handle: "one-smartphone",
  title: "One Smartphone",
  availableForSale: true,
  featuredImage: null,
  selectedOrFirstAvailableVariant: {
    id: "gid://shopify/ProductVariant/1",
    availableForSale: true,
    price: { amount: "799.0", currencyCode: "USD" },
    compareAtPrice: null,
  },
  priceRange: {
    minVariantPrice: { amount: "799.0", currencyCode: "USD" },
    maxVariantPrice: { amount: "799.0", currencyCode: "USD" },
  },
  badge: null,
  installmentMonths: null,
  conditionGrade: null,
  batteryHealth: null,
  vendor: "One",
  productType: "Phones",
  options: [{ name: "Storage", optionValues: [{ name: "128 GB" }, { name: "256 GB" }] }],
  shortSpecs: null,
};

function call(search: string, graphql = vi.fn()) {
  const args = {
    request: new Request(`https://sad.example/api/saved-products${search}`),
    context: { get: () => ({ graphql }) },
    params: {},
  } as unknown as LoaderArgs;

  return { response: loader(args), graphql };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/saved-products", () => {
  it("повертає товари у форматі картки з характеристиками й забороняє кешування", async () => {
    const graphql = vi.fn(async () => ({ data: { p0: PRODUCT, p1: null } }));
    const response = await call("?handles=one-smartphone,gone", graphql).response;

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({
      products: [
        expect.objectContaining({
          handle: "one-smartphone",
          variantId: "gid://shopify/ProductVariant/1",
          price: { amount: "799.0", currencyCode: "USD" },
          vendor: "One",
          productType: "Phones",
          options: [{ name: "Storage", values: ["128 GB", "256 GB"] }],
          shortSpecs: [],
        }),
      ],
    });
  });

  it.each([
    ["без параметра", ""],
    ["порожній перелік", "?handles=,"],
    ["зайві символи", "?handles=a%20b"],
    ["спроба вставити GraphQL", `?handles=${encodeURIComponent('a"){id}')}`],
    ["понад 24 handle", `?handles=${Array.from({ length: 25 }, (_, i) => `p${i}`).join(",")}`],
  ])("відповідає 400 і не ходить в API: %s", async (_name, search) => {
    const { response, graphql } = call(search);
    const result = await response;

    expect(result.status).toBe(400);
    expect(result.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await result.json()).toEqual({ error: expect.any(String) });
    expect(graphql).not.toHaveBeenCalled();
  });

  it("відповідає 502 на часткову відповідь із помилкою: клієнт не має прибирати товари зі списку", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const graphql = vi.fn(async () => ({
      data: { p0: PRODUCT, p1: null },
      errors: [{ message: "Internal error. Request ID: secret-123", path: ["p1"] }],
    }));
    const response = await call("?handles=one-smartphone,second", graphql).response;

    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    const body = (await response.json()) as { error: string; products?: unknown };
    expect(body.products).toBeUndefined();
    expect(body.error).not.toContain("secret-123");
  });

  it("відповідає 502, коли Storefront API недоступний", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const graphql = vi.fn(async () => {
      throw new Error("network");
    });
    const response = await call("?handles=a", graphql).response;

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "Не вдалося завантажити товари. Спробуйте ще раз за хвилину.",
    });
  });
});
