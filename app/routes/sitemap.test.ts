import { afterEach, describe, expect, it, vi } from "vitest";

import { loader } from "./sitemap";

type LoaderArgs = Parameters<typeof loader>[0];

const PAGE_INFO = { hasNextPage: false, endCursor: null };
const EMPTY = { nodes: [], pageInfo: PAGE_INFO };

function call(graphql: (query: unknown) => Promise<unknown>) {
  return loader({
    request: new Request("https://sad.example/sitemap.xml"),
    context: { get: () => ({ graphql }) },
    params: {},
  } as unknown as LoaderArgs);
}

const ok = async (query: unknown) => {
  const text = String(query);
  if (text.includes("query SitemapProducts")) {
    return {
      data: {
        products: {
          nodes: [{ handle: "iphone-17", updatedAt: "2026-11-01T00:00:00Z" }],
          pageInfo: PAGE_INFO,
        },
      },
    };
  }
  if (text.includes("query SitemapCollections")) return { data: { collections: EMPTY } };
  if (text.includes("query SitemapPages")) return { data: { pages: EMPTY } };
  return { data: { articles: EMPTY } };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /sitemap.xml", () => {
  it("віддає XML з товарами магазину й кешує його на годину", async () => {
    const response = await call(ok);
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/xml; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=3600");
    expect(xml).toContain("<loc>https://sad.example/products/iphone-17</loc>");
    expect(xml).not.toContain("/styleguide");
  });

  it("помилка GraphQL → 503 без кешування, а не карта з самих статичних сторінок", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await call(async (query) =>
      String(query).includes("query SitemapProducts")
        ? { data: null, errors: [{ message: "Throttled. Request ID: secret-123" }] }
        : ok(query),
    );
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).not.toContain("<urlset");
    expect(body).not.toContain("secret-123");
  });

  it("збій мережі → 503 без кешування", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await call(async () => {
      throw new Error("network");
    });

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(log).toHaveBeenCalled();
  });
});
