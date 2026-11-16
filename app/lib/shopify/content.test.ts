import { afterEach, describe, expect, it, vi } from "vitest";

import { ARTICLES_DEMO } from "~/components/home/articles";

import {
  countWords,
  htmlToText,
  loadArticle,
  loadBlog,
  loadContentPage,
  readingMinutes,
} from "./content";

type Client = Parameters<typeof loadContentPage>[0];

/** Клієнт Storefront API, який на будь-який запит відповідає заданими даними. */
function clientWith(data: unknown, errors?: { message: string }[]) {
  const graphql = vi.fn(async () => (errors ? { data, errors } : { data }));
  return { client: { graphql } as unknown as Client, graphql };
}

const API_ERROR = [{ message: "Internal error. Request ID: secret-123" }];
const LONG_CACHE = expect.objectContaining({ mode: "public", maxAge: 3600 });

const thrownBy = (promise: Promise<unknown>) => promise.catch((thrown: unknown) => thrown);

afterEach(() => {
  vi.restoreAllMocks();
});

const ARTICLE = {
  id: "gid://shopify/Article/1",
  handle: "persha",
  title: "Перша стаття",
  excerpt: "Короткий уривок.",
  publishedAt: "2026-11-10T09:00:00Z",
  image: null,
};

describe("loadContentPage", () => {
  it("віддає сторінку з магазину, якщо вона є", async () => {
    const { client, graphql } = clientWith({
      page: {
        id: "gid://shopify/Page/1",
        handle: "delivery",
        title: "Доставка з магазину",
        body: "<p>Текст з адмінки</p>",
        bodySummary: "Текст з адмінки",
        updatedAt: "2026-11-14T01:05:48Z",
        seo: { title: null, description: null },
      },
    });

    const page = await loadContentPage(client, "delivery");

    expect(graphql).toHaveBeenCalledWith(expect.any(String), {
      variables: { handle: "delivery" },
      cache: LONG_CACHE,
    });
    expect(page).toMatchObject({
      source: "shopify",
      title: "Доставка з магазину",
      description: "Текст з адмінки",
      body: { kind: "html", html: "<p>Текст з адмінки</p>" },
    });
  });

  it("для сервісної сторінки без запису в магазині віддає запасний вміст", async () => {
    const { client } = clientWith({ page: null });

    const page = await loadContentPage(client, "warranty");

    expect(page?.source).toBe("fallback");
    expect(page?.title).toBe("Гарантія");
    expect(page?.body.kind).toBe("sections");
  });

  it("для невідомого handle повертає null (маршрут відповість 404)", async () => {
    const { client } = clientWith({ page: null });

    await expect(loadContentPage(client, "nope")).resolves.toBeNull();
  });

  it("на помилку API не підміняє сервісну сторінку заготовкою: 502", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    for (const data of [{ page: null }, null]) {
      const { client } = clientWith(data, API_ERROR);
      const error = await thrownBy(loadContentPage(client, "warranty"));

      expect(error).toBeInstanceOf(Response);
      expect((error as Response).status).toBe(502);
      expect(await (error as Response).text()).not.toContain("secret-123");
    }
    expect(log).toHaveBeenCalledWith(expect.stringContaining("secret-123"));
  });

  it("на помилку API для невідомого handle теж 502, а не 404", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = clientWith({ page: null }, API_ERROR);

    expect(((await thrownBy(loadContentPage(client, "nope"))) as Response).status).toBe(502);
  });

  it("сторінка є, а помилка в другорядному полі — сторінка з магазину, помилка в журналі", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = clientWith(
      {
        page: {
          id: "gid://shopify/Page/1",
          handle: "delivery",
          title: "Доставка",
          body: "<p>Текст</p>",
          bodySummary: "Текст",
          updatedAt: "2026-11-14T01:05:48Z",
          seo: null,
        },
      },
      [{ message: "SEO unavailable" }],
    );

    expect((await loadContentPage(client, "delivery"))?.source).toBe("shopify");
    expect(log).toHaveBeenCalled();
  });
});

describe("loadBlog", () => {
  it("без блогу `blog` у магазині показує демо-статті", async () => {
    const { client } = clientWith({ blog: null });

    const blog = await loadBlog(client, "blog", new URLSearchParams());

    expect(blog?.source).toBe("fallback");
    expect(blog?.articles).toEqual(ARTICLES_DEMO);
    expect(blog?.olderCursor).toBeNull();
  });

  it("невідомий блог — null", async () => {
    const { client } = clientWith({ blog: null });

    await expect(loadBlog(client, "news", new URLSearchParams())).resolves.toBeNull();
  });

  it("читає блог із магазину та передає курсори в обидва боки", async () => {
    const { client, graphql } = clientWith({
      blog: {
        handle: "blog",
        title: "Блог",
        seo: null,
        articles: {
          nodes: [ARTICLE],
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: true,
            startCursor: "start",
            endCursor: "end",
          },
        },
      },
    });

    const blog = await loadBlog(client, "blog", new URLSearchParams("before=abc"));

    expect(graphql).toHaveBeenCalledWith(expect.any(String), {
      variables: { blog: "blog", last: 9, before: "abc" },
      cache: LONG_CACHE,
    });
    expect(blog).toMatchObject({
      source: "shopify",
      newerCursor: "start",
      olderCursor: "end",
      paginated: true,
    });
    expect(blog?.articles[0]).toMatchObject({ handle: "persha", excerpt: "Короткий уривок." });
  });
});

describe("loadBlog: помилки Storefront API", () => {
  it("на помилку API не показує демо-статті: 502", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    for (const data of [{ blog: null }, null]) {
      const { client } = clientWith(data, API_ERROR);
      const error = await thrownBy(loadBlog(client, "blog", new URLSearchParams()));

      expect(error).toBeInstanceOf(Response);
      expect((error as Response).status).toBe(502);
    }
  });

  it("зіпсований курсор → перехід на першу сторінку списку", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = clientWith({ blog: null }, [{ message: "invalid cursor" }]);
    const url = new URL("https://sad.example/blogs/blog?after=garbage");

    const error = await thrownBy(loadBlog(client, "blog", url.searchParams, url));

    expect((error as Response).status).toBe(302);
    expect((error as Response).headers.get("Location")).toBe("/blogs/blog");
  });

  it("курсор без адреси запиту (виклик не з маршруту) → 502", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = clientWith({ blog: null }, [{ message: "invalid cursor" }]);

    const error = await thrownBy(loadBlog(client, "blog", new URLSearchParams("after=garbage")));

    expect((error as Response).status).toBe(502);
  });
});

describe("loadArticle: помилки Storefront API", () => {
  const handle = ARTICLES_DEMO[0]?.handle ?? "";

  it("на помилку API не підміняє статтю демо-текстом: 502", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    for (const data of [{ blog: null }, null]) {
      const { client } = clientWith(data, API_ERROR);

      expect(((await thrownBy(loadArticle(client, "blog", handle))) as Response).status).toBe(502);
    }
  });

  it("блог є, статті немає, але API повідомив про помилку — 502, а не 404", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = clientWith(
      { blog: { handle: "blog", title: "Блог", articleByHandle: null, articles: { nodes: [] } } },
      API_ERROR,
    );

    expect(((await thrownBy(loadArticle(client, "blog", handle))) as Response).status).toBe(502);
  });
});

describe("loadArticle", () => {
  it("віддає статтю, час читання й до трьох інших статей", async () => {
    const others = ["druha", "tretia", "chetverta"].map((handle) => ({ ...ARTICLE, handle }));
    const { client } = clientWith({
      blog: {
        handle: "blog",
        title: "Блог",
        articleByHandle: {
          ...ARTICLE,
          contentHtml: `<p>${"слово ".repeat(450)}</p>`,
          authorV2: { name: "Олег" },
          seo: null,
        },
        articles: { nodes: [ARTICLE, ...others] },
      },
    });

    const data = await loadArticle(client, "blog", "persha");

    expect(data?.source).toBe("shopify");
    expect(data?.article.wordCount).toBe(450);
    expect(data?.article.readingMinutes).toBe(2);
    expect(data?.article.authorName).toBe("Олег");
    expect(data?.related.map((article) => article.handle)).toEqual([
      "druha",
      "tretia",
      "chetverta",
    ]);
  });

  it("блог є, а статті немає — null, без підміни демо-статтею", async () => {
    const { client } = clientWith({
      blog: { handle: "blog", title: "Блог", articleByHandle: null, articles: { nodes: [] } },
    });

    await expect(loadArticle(client, "blog", ARTICLES_DEMO[0]?.handle ?? "")).resolves.toBeNull();
  });

  it("без блогу в магазині віддає запасний текст демо-статті", async () => {
    const { client } = clientWith({ blog: null });
    const handle = ARTICLES_DEMO[0]?.handle ?? "";

    const data = await loadArticle(client, "blog", handle);

    expect(data?.source).toBe("fallback");
    expect(data?.article.body.kind).toBe("sections");
    expect(data?.related.some((article) => article.handle === handle)).toBe(false);
    expect(data?.related).toHaveLength(ARTICLES_DEMO.length - 1);
    await expect(loadArticle(client, "blog", "nope")).resolves.toBeNull();
    await expect(loadArticle(client, "news", handle)).resolves.toBeNull();
  });
});

describe("текстові помічники", () => {
  it("htmlToText прибирає теги, скрипти й зайві пробіли", () => {
    expect(htmlToText("<h2>Заголовок</h2>\n<p>Текст&nbsp;тут</p><script>alert(1)</script>")).toBe(
      "Заголовок Текст тут",
    );
  });

  it("countWords і readingMinutes", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("  один два  три ")).toBe(3);
    expect(readingMinutes(0)).toBe(1);
    expect(readingMinutes(1000)).toBe(5);
  });
});
