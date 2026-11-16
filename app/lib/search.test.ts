import { afterEach, describe, expect, it, vi } from "vitest";

import { loadSearchPage, searchPagination } from "./search";

const params = (query: string) => new URLSearchParams(query);

describe("searchPagination", () => {
  it("на єдиній сторінці посилань немає", () => {
    expect(
      searchPagination(params("q=iphone"), { hasNextPage: false, hasPreviousPage: false }),
    ).toEqual({ previousHref: null, nextHref: null });
  });

  it("наступна сторінка йде за endCursor і зберігає запит", () => {
    const { nextHref, previousHref } = searchPagination(params("q=iphone 17"), {
      hasNextPage: true,
      hasPreviousPage: false,
      endCursor: "end",
    });

    expect(nextHref).toBe("/search?q=iphone+17&after=end");
    expect(previousHref).toBeNull();
  });

  it("попередня сторінка йде перед startCursor; старий курсор з адреси зникає", () => {
    const { nextHref, previousHref } = searchPagination(params("q=mac&after=old&sort_by=price"), {
      hasNextPage: true,
      hasPreviousPage: true,
      startCursor: "start",
      endCursor: "end",
    });

    expect(previousHref).toBe("/search?q=mac&sort_by=price&before=start");
    expect(nextHref).toBe("/search?q=mac&sort_by=price&after=end");
  });

  it("без курсора посилання не будується", () => {
    expect(searchPagination(params("q=mac"), { hasNextPage: true, hasPreviousPage: true })).toEqual(
      { previousHref: null, nextHref: null },
    );
  });
});

describe("loadSearchPage", () => {
  type Client = Parameters<typeof loadSearchPage>[0]["storefrontClient"];

  const PAGE_INFO = {
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null,
    endCursor: null,
  };
  const PRODUCT = {
    __typename: "Product",
    id: "gid://shopify/Product/1",
    handle: "iphone-17",
    title: "iPhone 17",
    availableForSale: true,
    featuredImage: null,
    selectedOrFirstAvailableVariant: {
      id: "gid://shopify/ProductVariant/1",
      availableForSale: true,
      price: { amount: "44999.0", currencyCode: "UAH" },
      compareAtPrice: null,
    },
    priceRange: {
      minVariantPrice: { amount: "44999.0", currencyCode: "UAH" },
      maxVariantPrice: { amount: "44999.0", currencyCode: "UAH" },
    },
    badge: null,
    installmentMonths: null,
    conditionGrade: null,
    batteryHealth: null,
  };

  function clientWith(response: unknown) {
    const graphql = vi.fn(async () => response);
    return { storefrontClient: { graphql } as unknown as Client, graphql };
  }

  const request = (search: string) => new Request(`https://sad.example/search${search}`);
  const thrownBy = (promise: Promise<unknown>) => promise.catch((thrown: unknown) => thrown);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("без запиту не ходить в API", async () => {
    const { storefrontClient, graphql } = clientWith({ data: null });

    const data = await loadSearchPage({ storefrontClient, request: request("") });

    expect(data.performed).toBe(false);
    expect(graphql).not.toHaveBeenCalled();
  });

  it("повертає товари й кешує запит коротко", async () => {
    const { storefrontClient, graphql } = clientWith({
      data: { search: { totalCount: 1, pageInfo: PAGE_INFO, nodes: [PRODUCT] } },
    });

    const data = await loadSearchPage({ storefrontClient, request: request("?q=iphone") });

    expect(data).toMatchObject({ performed: true, searchTerm: "iphone", totalCount: 1 });
    expect(data.products.map((item) => item.handle)).toEqual(["iphone-17"]);
    expect(graphql).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        variables: expect.objectContaining({ term: "iphone", first: 20 }),
        cache: expect.objectContaining({ mode: "public", maxAge: 1 }),
      }),
    );
  });

  it("помилка API без даних → 502 без тексту магазину", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { storefrontClient } = clientWith({
      data: null,
      errors: [{ message: "Internal error. Request ID: secret-123" }],
    });

    const error = await thrownBy(loadSearchPage({ storefrontClient, request: request("?q=x") }));

    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(502);
    expect(await (error as Response).text()).not.toContain("secret-123");
    expect(log).toHaveBeenCalledWith(expect.stringContaining("secret-123"));
  });

  it("зіпсований курсор → перехід на першу сторінку тих самих результатів", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { storefrontClient } = clientWith({
      data: null,
      errors: [{ message: "invalid cursor" }],
    });

    const error = await thrownBy(
      loadSearchPage({
        storefrontClient,
        request: request("?q=x&sort_by=price-ascending&after=garbage"),
      }),
    );

    expect((error as Response).status).toBe(302);
    expect((error as Response).headers.get("Location")).toBe("/search?q=x&sort_by=price-ascending");
  });

  it("результати є, а помилка в другорядному полі — сторінка працює", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { storefrontClient } = clientWith({
      data: { search: { totalCount: 1, pageInfo: PAGE_INFO, nodes: [PRODUCT] } },
      errors: [{ message: "Metafield error" }],
    });

    const data = await loadSearchPage({
      storefrontClient,
      request: request("?q=iphone&after=abc"),
    });

    expect(data.products).toHaveLength(1);
    expect(log).toHaveBeenCalled();
  });
});
