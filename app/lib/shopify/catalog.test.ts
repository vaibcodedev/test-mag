import { afterEach, describe, expect, it, vi } from "vitest";

import { CATALOG_LINKS } from "~/lib/content/site";

import { loadCatalog } from "./catalog";

type Client = Parameters<typeof loadCatalog>[0];

const IMAGE = { url: "https://cdn.shopify.com/a.png", altText: null, width: 800, height: 800 };

function clientWith(respond: () => Promise<unknown>) {
  const graphql = vi.fn(respond);
  return { client: { graphql } as unknown as Client, graphql };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadCatalog", () => {
  it("бере фото з колекції з тим самим handle і кешує запит надовго", async () => {
    const handle = CATALOG_LINKS[0]?.to.split("/").pop() ?? "";
    const { client, graphql } = clientWith(async () => ({
      data: { collections: { nodes: [{ handle, image: IMAGE, products: { nodes: [] } }] } },
    }));

    const catalog = await loadCatalog(client);

    expect(catalog).toHaveLength(CATALOG_LINKS.length);
    expect(catalog[0]?.image).toEqual(IMAGE);
    expect(graphql).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ cache: expect.objectContaining({ mode: "public", maxAge: 3600 }) }),
    );
  });

  it("колекція без фото показує фото свого першого товару, а не чужого", async () => {
    const [first, second] = CATALOG_LINKS.map((link) => link.to.split("/").pop() ?? "");
    const { client } = clientWith(async () => ({
      data: {
        collections: {
          nodes: [
            { handle: first, image: null, products: { nodes: [{ featuredImage: IMAGE }] } },
            { handle: second, image: null, products: { nodes: [] } },
          ],
        },
      },
    }));

    const catalog = await loadCatalog(client);

    expect(catalog[0]?.image).toEqual(IMAGE);
    expect(catalog[1]?.image).toBeNull();
  });

  it("помилка GraphQL: меню лишається без фото, помилка в журналі", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = clientWith(async () => ({
      data: null,
      errors: [{ message: "Throttled" }],
    }));

    const catalog = await loadCatalog(client);

    expect(catalog.map((item) => item.to)).toEqual(CATALOG_LINKS.map((link) => link.to));
    expect(catalog.every((item) => item.image === null)).toBe(true);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Throttled"));
  });

  it("збій мережі не ламає шапку", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = clientWith(async () => {
      throw new Error("network");
    });

    const catalog = await loadCatalog(client);

    expect(catalog).toHaveLength(CATALOG_LINKS.length);
  });
});
