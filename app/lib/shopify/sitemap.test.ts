import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildSitemapXml,
  collectNodes,
  escapeXml,
  loadSitemapEntries,
  STATIC_SITEMAP_ENTRIES,
} from "./sitemap";

const ORIGIN = "https://sad.example";

function parse(xml: string): Document {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  expect(document.querySelector("parsererror")).toBeNull();
  return document;
}

const locs = (document: Document) =>
  [...document.querySelectorAll("url > loc")].map((node) => node.textContent);

describe("escapeXml", () => {
  it("екранує п'ять службових символів XML", () => {
    expect(escapeXml(`a&b<c>d"e'f`)).toBe("a&amp;b&lt;c&gt;d&quot;e&apos;f");
  });

  it("не екранує вже екрановане двічі непомітно: амперсанд завжди стає &amp;", () => {
    expect(escapeXml("&amp;")).toBe("&amp;amp;");
  });
});

describe("buildSitemapXml", () => {
  it("будує коректний urlset з абсолютними адресами та lastmod", () => {
    const xml = buildSitemapXml(
      [
        { path: "/" },
        { path: "/products/iphone-17", lastmod: "2026-11-14T01:05:48Z" },
        { path: "/collections/mac", lastmod: null },
      ],
      ORIGIN,
    );
    const document = parse(xml);
    const root = document.documentElement;

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(true);
    expect(root.tagName).toBe("urlset");
    expect(root.namespaceURI).toBe("http://www.sitemaps.org/schemas/sitemap/0.9");
    expect(locs(document)).toEqual([
      `${ORIGIN}/`,
      `${ORIGIN}/products/iphone-17`,
      `${ORIGIN}/collections/mac`,
    ]);

    const urls = [...document.querySelectorAll("url")];
    expect(urls[0]?.querySelector("lastmod")).toBeNull();
    expect(urls[1]?.querySelector("lastmod")?.textContent).toBe("2026-11-14T01:05:48.000Z");
    expect(urls[2]?.querySelector("lastmod")).toBeNull();
  });

  it("екранує та кодує небезпечні символи в адресах", () => {
    const xml = buildSitemapXml([{ path: `/products/a&b<c>"d' e` }], `${ORIGIN}/`);
    const document = parse(xml);

    expect(xml).not.toContain("a&b");
    expect(xml).not.toContain("<c>");
    expect(locs(document)).toEqual([`${ORIGIN}/products/a%26b%3Cc%3E%22d'%20e`]);
    expect(xml).toContain("d&apos;%20e");
  });

  it("екранує origin із параметрами", () => {
    const xml = buildSitemapXml([{ path: "/" }], "https://sad.example/?a=1&b=2");

    expect(xml).toContain("&amp;b=2");
    parse(xml);
  });

  it("відкидає повтори, відносні шляхи та службові розділи", () => {
    const document = parse(
      buildSitemapXml(
        [
          { path: "/pages/delivery" },
          { path: "/pages/delivery", lastmod: "2026-01-01T00:00:00Z" },
          { path: "products/no-slash" },
          { path: "/cart" },
          { path: "/cart/123:1" },
          { path: "/search" },
          { path: "/account" },
          { path: "/account/login" },
          { path: "/wishlist" },
          { path: "/compare" },
          { path: "/styleguide" },
          { path: "/products/cart-organizer" },
          { path: "/pages/search-tips" },
        ],
        ORIGIN,
      ),
    );

    expect(locs(document)).toEqual([
      `${ORIGIN}/pages/delivery`,
      `${ORIGIN}/products/cart-organizer`,
      `${ORIGIN}/pages/search-tips`,
    ]);
  });

  it("пропускає некоректну дату замість того, щоб зламати XML", () => {
    const document = parse(buildSitemapXml([{ path: "/", lastmod: "не дата" }], ORIGIN));

    expect(document.querySelector("lastmod")).toBeNull();
  });

  it("порожній список дає коректний порожній urlset", () => {
    const document = parse(buildSitemapXml([], ORIGIN));

    expect(document.querySelectorAll("url")).toHaveLength(0);
  });
});

describe("STATIC_SITEMAP_ENTRIES", () => {
  it("містить головну, каталог, сім сервісних сторінок і блог", () => {
    expect(STATIC_SITEMAP_ENTRIES.map((entry) => entry.path)).toEqual([
      "/",
      "/collections",
      "/pages/delivery",
      "/pages/installments",
      "/pages/warranty",
      "/pages/trade-in",
      "/pages/returns",
      "/pages/imei",
      "/pages/contacts",
      "/blogs/blog",
    ]);
  });
});

describe("collectNodes", () => {
  it("іде за курсором, доки є наступна сторінка", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ nodes: [1, 2], pageInfo: { hasNextPage: true, endCursor: "a" } })
      .mockResolvedValueOnce({ nodes: [3], pageInfo: { hasNextPage: false, endCursor: "b" } });

    await expect(collectNodes<number>(fetchPage)).resolves.toEqual([1, 2, 3]);
    expect(fetchPage.mock.calls).toEqual([[null], ["a"]]);
  });

  it("зупиняється на стелі сторінок і на порожній відповіді", async () => {
    const endless = vi.fn(async () => ({
      nodes: ["x"],
      pageInfo: { hasNextPage: true, endCursor: "next" },
    }));

    await expect(collectNodes<string>(endless, 3)).resolves.toEqual(["x", "x", "x"]);
    expect(endless).toHaveBeenCalledTimes(3);
    await expect(collectNodes<string>(async () => null)).resolves.toEqual([]);
  });
});

describe("loadSitemapEntries", () => {
  type Client = Parameters<typeof loadSitemapEntries>[0];

  const PAGE_INFO = { hasNextPage: false, endCursor: null };
  const DATA: Record<string, unknown> = {
    SitemapProducts: {
      products: {
        nodes: [{ handle: "iphone-17", updatedAt: "2026-11-01T00:00:00Z" }],
        pageInfo: PAGE_INFO,
      },
    },
    SitemapCollections: {
      collections: {
        nodes: [{ handle: "iphone", updatedAt: "2026-11-02T00:00:00Z" }],
        pageInfo: PAGE_INFO,
      },
    },
    SitemapPages: {
      pages: {
        nodes: [{ handle: "delivery", updatedAt: "2026-11-03T00:00:00Z" }],
        pageInfo: PAGE_INFO,
      },
    },
    SitemapArticles: {
      articles: {
        nodes: [
          { handle: "persha", publishedAt: "2026-11-04T00:00:00Z", blog: { handle: "blog" } },
        ],
        pageInfo: PAGE_INFO,
      },
    },
  };

  /** Клієнт, що відповідає за назвою операції; `override` підміняє відповідь одного запиту. */
  function clientWith(override: Record<string, unknown> = {}) {
    const graphql = vi.fn(async (query: unknown, _options?: { cache?: unknown }) => {
      const name = Object.keys(DATA).find((operation) =>
        String(query).includes(`query ${operation}`),
      );
      if (!name) throw new Error("невідомий запит");
      return name in override ? override[name] : { data: DATA[name] };
    });
    return { client: { graphql } as unknown as Client, graphql };
  }

  const thrownBy = (promise: Promise<unknown>) => promise.catch((thrown: unknown) => thrown);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("збирає статичні сторінки й адреси магазину, запити кешує надовго", async () => {
    const { client, graphql } = clientWith();

    const entries = await loadSitemapEntries(client);
    const paths = entries.map((entry) => entry.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        "/",
        "/collections/iphone",
        "/products/iphone-17",
        "/blogs/blog/persha",
      ]),
    );
    expect(paths).not.toContain("/styleguide");
    // Сервісна сторінка з магазину отримує його дату зміни.
    expect(entries.find((entry) => entry.path === "/pages/delivery")?.lastmod).toBe(
      "2026-11-03T00:00:00Z",
    );
    expect(graphql).toHaveBeenCalledTimes(4);
    for (const [, options] of graphql.mock.calls) {
      expect(options?.cache).toMatchObject({ mode: "public", maxAge: 3600 });
    }
  });

  it("відповідь без даних в одному із запитів → 5xx, а не карта без товарів", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = clientWith({
      SitemapProducts: { data: null, errors: [{ message: "Throttled" }] },
    });

    const error = await thrownBy(loadSitemapEntries(client));

    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(502);
  });

  it("часткова відповідь із помилкою → теж 5xx", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = clientWith({
      SitemapArticles: {
        data: { articles: { nodes: [], pageInfo: PAGE_INFO } },
        errors: [{ message: "Access denied" }],
      },
    });

    const error = await thrownBy(loadSitemapEntries(client));

    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(503);
  });

  it("збій мережі кидає далі", async () => {
    const { client } = clientWith();
    (client.graphql as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("network"));

    await expect(loadSitemapEntries(client)).rejects.toThrow("network");
  });
});
