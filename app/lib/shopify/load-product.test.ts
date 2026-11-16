import { afterEach, describe, expect, it, vi } from "vitest";

import { loadProductPage } from "./load-product";
import type { ProductPageData } from "./product";

type Client = Parameters<typeof loadProductPage>[0];

const PRODUCT = { handle: "iphone-17-pro", title: "iPhone 17 Pro" } as ProductPageData;

const card = {
  id: "gid://shopify/Product/2",
  handle: "airpods-pro-3",
  title: "AirPods Pro 3",
  availableForSale: true,
  featuredImage: null,
  selectedOrFirstAvailableVariant: {
    id: "gid://shopify/ProductVariant/2",
    availableForSale: true,
    price: { amount: "11999.0", currencyCode: "UAH" },
    compareAtPrice: null,
  },
  priceRange: {
    minVariantPrice: { amount: "11999.0", currencyCode: "UAH" },
    maxVariantPrice: { amount: "11999.0", currencyCode: "UAH" },
  },
  badge: null,
  installmentMonths: null,
  conditionGrade: null,
  batteryHealth: null,
};

function client(responses: unknown[]) {
  const graphql = vi.fn();
  for (const response of responses) graphql.mockResolvedValueOnce(response);
  return { graphql } as unknown as Client & { graphql: ReturnType<typeof vi.fn> };
}

const thrownBy = (promise: Promise<unknown>) => promise.catch((thrown: unknown) => thrown);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadProductPage", () => {
  it("передає вибрані опції з адреси, кешує коротко та повертає товар зі схожими", async () => {
    const storefront = client([
      { data: { product: PRODUCT } },
      { data: { productRecommendations: [card, { ...card, handle: "iphone-17-pro" }] } },
    ]);

    const page = await loadProductPage(
      storefront,
      "iphone-17-pro",
      new URLSearchParams("Колір=Срібний"),
    );

    expect(storefront.graphql.mock.calls[0]?.[1]).toEqual({
      variables: {
        handle: "iphone-17-pro",
        selectedOptions: [{ name: "Колір", value: "Срібний" }],
      },
      cache: expect.objectContaining({ mode: "public", maxAge: 1 }),
    });
    expect(page?.product.handle).toBe("iphone-17-pro");
    expect(page?.related.map((item) => item.handle)).toEqual(["airpods-pro-3"]);
  });

  it("товару немає і помилок немає — null (маршрут відповідає 404)", async () => {
    const storefront = client([
      { data: { product: null } },
      { data: { productRecommendations: null } },
    ]);

    expect(await loadProductPage(storefront, "nope", new URLSearchParams())).toBeNull();
  });

  it("помилка GraphQL без товару — 502, а не 404", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const storefront = client([
      { data: { product: null }, errors: [{ message: "Internal error. Request ID: secret-123" }] },
      { data: { productRecommendations: [] } },
    ]);

    const error = await thrownBy(
      loadProductPage(storefront, "iphone-17-pro", new URLSearchParams()),
    );

    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(502);
    expect(await (error as Response).text()).not.toContain("secret-123");
    expect(log).toHaveBeenCalledWith(expect.stringContaining("secret-123"));
  });

  it("відповідь без даних — 502", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const storefront = client([
      { data: null, errors: [{ message: "Throttled" }] },
      { data: { productRecommendations: [] } },
    ]);

    const error = await thrownBy(
      loadProductPage(storefront, "iphone-17-pro", new URLSearchParams()),
    );

    expect((error as Response).status).toBe(502);
  });

  it("товар є, а помилка в другорядному полі — сторінка працює", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const storefront = client([
      { data: { product: PRODUCT }, errors: [{ message: "Metafield error" }] },
      { data: { productRecommendations: [] } },
    ]);

    const page = await loadProductPage(storefront, "iphone-17-pro", new URLSearchParams());

    expect(page?.product).toBe(PRODUCT);
    expect(log).toHaveBeenCalled();
  });

  it("сторінка працює, коли рекомендації не завантажились: збій мережі або помилка GraphQL", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const network = vi
      .fn()
      .mockResolvedValueOnce({ data: { product: PRODUCT } })
      .mockRejectedValueOnce(new Error("network"));
    const graphqlError = client([
      { data: { product: PRODUCT } },
      { data: null, errors: [{ message: "Recommendations unavailable" }] },
    ]);

    const first = await loadProductPage(
      { graphql: network } as unknown as Client,
      "iphone-17-pro",
      new URLSearchParams(),
    );
    const second = await loadProductPage(graphqlError, "iphone-17-pro", new URLSearchParams());

    expect(first?.related).toEqual([]);
    expect(second?.related).toEqual([]);
  });
});
