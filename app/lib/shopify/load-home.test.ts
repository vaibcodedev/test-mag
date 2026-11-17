import { afterEach, describe, expect, it, vi } from "vitest";

import { endOfKyivWeek, loadHomeProducts } from "./load-home";

type Client = Parameters<typeof loadHomeProducts>[0];

function product(handle: string, overrides: Record<string, unknown> = {}) {
  return {
    id: `gid://shopify/Product/${handle}`,
    handle,
    title: handle,
    availableForSale: true,
    featuredImage: null,
    selectedOrFirstAvailableVariant: {
      id: `gid://shopify/ProductVariant/${handle}`,
      availableForSale: true,
      price: { amount: "1000.0", currencyCode: "UAH" },
      compareAtPrice: null,
    },
    priceRange: {
      minVariantPrice: { amount: "1000.0", currencyCode: "UAH" },
      maxVariantPrice: { amount: "1000.0", currencyCode: "UAH" },
    },
    badge: null,
    installmentMonths: null,
    conditionGrade: null,
    batteryHealth: null,
    cardColorSwatches: null,
    cardOptions: [],
    ...overrides,
  };
}

const collectionOf = (...handles: string[]) => ({
  products: { nodes: handles.map((handle) => product(handle)) },
});

function clientWith(response: unknown) {
  const graphql = vi.fn(async () => response);
  return { client: { graphql } as unknown as Client, graphql };
}

const NOW = new Date("2026-11-16T10:00:00Z");

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadHomeProducts", () => {
  it("бере знижки з колекції deals, вживану техніку з used, а популярне — з товарів магазину", async () => {
    const { client, graphql } = clientWith({
      data: {
        products: {
          nodes: [
            product("iphone-17"),
            product("iphone-15-used", { conditionGrade: { value: "Відмінний" } }),
            product("airpods"),
          ],
        },
        deals: collectionOf("deal-1", "deal-2"),
        used: collectionOf("used-1"),
      },
    });

    const home = await loadHomeProducts(client, NOW);

    expect(home.deals.map((item) => item.handle)).toEqual(["deal-1", "deal-2"]);
    expect(home.used.map((item) => item.handle)).toEqual(["used-1"]);
    // Вживаний пристрій у «Популярне» не потрапляє.
    expect(home.popular.map((item) => item.handle)).toEqual(["iphone-17", "airpods"]);
    expect(home.now).toBe(NOW.toISOString());
    expect(graphql).toHaveBeenCalledWith(expect.any(String), {
      variables: { first: 16, deals: 12, used: 3, iphones: 24 },
      cache: expect.objectContaining({ mode: "public", maxAge: 1 }),
    });
  });

  it("рядок знижок, плитки біля банера й фото iPhone збираються з товарів магазину", async () => {
    const sale = product("macbook-air", {
      selectedOrFirstAvailableVariant: {
        id: "gid://shopify/ProductVariant/macbook-air",
        availableForSale: true,
        price: { amount: "900.0", currencyCode: "UAH" },
        compareAtPrice: { amount: "1000.0", currencyCode: "UAH" },
      },
    });
    const image = { url: "https://cdn.shopify.com/i.jpg", altText: null, width: 800, height: 800 };
    const { client } = clientWith({
      data: {
        products: { nodes: [] },
        deals: { products: { nodes: [product("no-discount"), sale] } },
        used: null,
        newest: collectionOf("watch-11"),
        iphones: {
          products: {
            nodes: [
              {
                handle: "iphone-17",
                featuredImage: image,
                priceRange: { minVariantPrice: { amount: "44999.0", currencyCode: "UAH" } },
              },
            ],
          },
        },
      },
    });

    const home = await loadHomeProducts(client, NOW);

    expect(home.ticker).toEqual([
      { title: "macbook-air", discount: "−10%", to: "/products/macbook-air" },
    ]);
    expect(home.promoNew).toMatchObject({ to: "/products/watch-11" });
    expect(home.promoSale).toMatchObject({ to: "/products/macbook-air" });
    expect(home.iphones["iphone-17"]).toEqual({
      image,
      price: { amount: "44999.0", currencyCode: "UAH" },
    });
  });

  it("магазин без колекцій new та iphone: плиток і фото немає", async () => {
    const { client } = clientWith({
      data: { products: { nodes: [] }, deals: null, used: null },
    });

    const home = await loadHomeProducts(client, NOW);

    expect(home).toMatchObject({ ticker: [], promoNew: null, promoSale: null, iphones: {} });
  });

  it("популярне береться з колекції hits, коли вона є", async () => {
    const { client } = clientWith({
      data: {
        products: { nodes: [product("first-in-store")] },
        hits: collectionOf("hit-1", "hit-2"),
        deals: null,
        used: null,
      },
    });

    const home = await loadHomeProducts(client, NOW);

    expect(home.popular.map((item) => item.handle)).toEqual(["hit-1", "hit-2"]);
  });

  it("порожня колекція hits: популярне — перші товари магазину", async () => {
    const { client } = clientWith({
      data: {
        products: { nodes: [product("first-in-store")] },
        hits: collectionOf(),
        deals: null,
        used: null,
      },
    });

    const home = await loadHomeProducts(client, NOW);

    expect(home.popular.map((item) => item.handle)).toEqual(["first-in-store"]);
  });

  it("магазин без колекцій deals і used: списки порожні, вигаданих товарів немає", async () => {
    const { client } = clientWith({
      data: { products: { nodes: [product("iphone-17")] }, deals: null, used: null },
    });

    const home = await loadHomeProducts(client, NOW);

    expect(home.deals).toEqual([]);
    expect(home.used).toEqual([]);
    expect(home.popular).toHaveLength(1);
  });

  it("порожні колекції теж дають порожні списки", async () => {
    const { client } = clientWith({
      data: { products: { nodes: [] }, deals: collectionOf(), used: collectionOf() },
    });

    const home = await loadHomeProducts(client, NOW);

    expect(home).toMatchObject({ deals: [], used: [], popular: [] });
  });

  it("відповідь без даних — 502", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = clientWith({
      data: null,
      errors: [{ message: "Throttled. Request ID: secret-123" }],
    });

    const error = await loadHomeProducts(client, NOW).catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(502);
    expect(await (error as Response).text()).not.toContain("secret-123");
    expect(log).toHaveBeenCalledWith(expect.stringContaining("secret-123"));
  });

  it("помилка в одній колекції: решта працює, секція з помилкою порожня, помилка в журналі", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = clientWith({
      data: { products: { nodes: [product("iphone-17")] }, deals: null, used: collectionOf("u") },
      errors: [{ message: "Collection unavailable", path: ["deals"] }],
    });

    const home = await loadHomeProducts(client, NOW);

    expect(home.deals).toEqual([]);
    expect(home.used).toHaveLength(1);
    expect(home.popular).toHaveLength(1);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("deals"));
  });
});

describe("endOfKyivWeek", () => {
  const end = (now: string) => endOfKyivWeek(new Date(now));

  it("узимку (UTC+2) кінець неділі — 21:59:59 UTC", () => {
    // Понеділок, 16 листопада 2026.
    expect(end("2026-11-16T10:00:00Z")).toBe("2026-11-22T21:59:59.000Z");
  });

  it("улітку (UTC+3) кінець неділі — 20:59:59 UTC", () => {
    // Середа, 15 липня 2026.
    expect(end("2026-07-15T10:00:00Z")).toBe("2026-07-19T20:59:59.000Z");
  });

  it("у неділю до півночі за Києвом акція закінчується сьогодні", () => {
    expect(end("2026-07-19T20:00:00Z")).toBe("2026-07-19T20:59:59.000Z");
    expect(end("2026-11-22T21:00:00Z")).toBe("2026-11-22T21:59:59.000Z");
  });

  it("улітку о 21:30 UTC у неділю в Києві вже понеділок: кінець — наступна неділя", () => {
    // За старим розрахунком (21:59:59 UTC) акція «тривала» б ще пів години понеділка.
    expect(end("2026-07-19T21:30:00Z")).toBe("2026-07-26T20:59:59.000Z");
  });

  it("день тижня рахується за Києвом, а не за UTC", () => {
    // Субота 22:30 UTC = неділя 01:30 у Києві (літо): кінець — ця ж неділя.
    expect(end("2026-07-18T22:30:00Z")).toBe("2026-07-19T20:59:59.000Z");
  });

  it("тиждень переходу на літній час: неділя 29 березня 2026 закінчується вже за UTC+3", () => {
    expect(end("2026-03-25T10:00:00Z")).toBe("2026-03-29T20:59:59.000Z");
    // У саму неділю до переведення годинників (00:30 UTC = 02:30 за Києвом, ще UTC+2).
    expect(end("2026-03-29T00:30:00Z")).toBe("2026-03-29T20:59:59.000Z");
  });

  it("тиждень переходу на зимовий час: неділя 25 жовтня 2026 закінчується вже за UTC+2", () => {
    expect(end("2026-10-21T10:00:00Z")).toBe("2026-10-25T21:59:59.000Z");
    // У саму неділю до переведення годинників (00:30 UTC = 03:30 за Києвом, ще UTC+3).
    expect(end("2026-10-25T00:30:00Z")).toBe("2026-10-25T21:59:59.000Z");
  });

  it("рівно в останню секунду неділі повертає наступну неділю", () => {
    expect(end("2026-11-22T21:59:59Z")).toBe("2026-11-29T21:59:59.000Z");
  });
});
