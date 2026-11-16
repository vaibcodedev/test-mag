import { Cache } from "@shopify/hydrogen";

import {
  SITEMAP_ARTICLES_QUERY,
  SITEMAP_COLLECTIONS_QUERY,
  SITEMAP_PAGES_QUERY,
  SITEMAP_PRODUCTS_QUERY,
} from "~/graphql/queries/sitemap.query";
import { SERVICE_PAGES } from "~/lib/content/pages";
import type { StorefrontGraphqlClient } from "~/lib/storefront";

import { hasGraphqlErrors, requireData, upstreamErrorResponse, type GraphqlResult } from "./errors";

type Client = StorefrontGraphqlClient;

/** Для карти сайту часткова відповідь не годиться: будь-яка помилка GraphQL — це збій. */
function strictData<Data>(label: string, result: GraphqlResult<Data>): Data {
  const data = requireData(label, result);
  if (hasGraphqlErrors(result)) throw upstreamErrorResponse(503);
  return data;
}

export type SitemapEntry = {
  /** Шлях на сайті: «/products/iphone-17». */
  path: string;
  /** Дата останньої зміни в ISO 8601; некоректна дата в XML не потрапляє. */
  lastmod?: string | null;
};

/** Найбільший розмір сторінки, який дозволяє Storefront API. */
const PAGE_SIZE = 250;
/** Стеля запитів на один тип: до 1000 адрес. Більшому каталогу потрібен індекс sitemap. */
const MAX_PAGES = 4;

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => XML_ESCAPES[character] ?? character);
}

/** Сторінки, які є завжди: головна, каталог, сервісні сторінки й блог. */
export const STATIC_SITEMAP_ENTRIES: SitemapEntry[] = [
  { path: "/" },
  { path: "/collections" },
  ...SERVICE_PAGES.map((page) => ({ path: `/pages/${page.handle}` })),
  { path: "/blogs/blog" },
];

/** Розділи, яких у sitemap бути не може, навіть якщо такий handle прийде з магазину. */
const EXCLUDED_PREFIXES = [
  "/cart",
  "/search",
  "/account",
  "/wishlist",
  "/compare",
  "/styleguide",
  "/checkout",
  "/api/",
];

function isExcluded(path: string): boolean {
  return EXCLUDED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`),
  );
}

function toLastmod(value: string | null | undefined): string | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

/** «/blogs/blog/a b» → «/blogs/blog/a%20b»: кожен сегмент шляху кодується окремо. */
function encodePath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

/**
 * XML карти сайту. Адреси абсолютні, від `origin`; повтори шляхів відкидаються
 * (перша поява виграє), службові розділи не потрапляють, усі значення екрануються.
 */
export function buildSitemapXml(entries: readonly SitemapEntry[], origin: string): string {
  const base = origin.endsWith("/") ? origin.slice(0, -1) : origin;
  const seen = new Set<string>();
  const urls: string[] = [];

  for (const entry of entries) {
    if (!entry.path.startsWith("/") || isExcluded(entry.path) || seen.has(entry.path)) continue;
    seen.add(entry.path);

    const lastmod = toLastmod(entry.lastmod);
    urls.push(
      [
        "  <url>",
        `    <loc>${escapeXml(`${base}${encodePath(entry.path)}`)}</loc>`,
        ...(lastmod ? [`    <lastmod>${escapeXml(lastmod)}</lastmod>`] : []),
        "  </url>",
      ].join("\n"),
    );
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

type Connection<Node> = {
  nodes: Node[];
  pageInfo: { hasNextPage: boolean; endCursor?: string | null };
};

/** Обходить з'єднання за курсором, доки є наступна сторінка або не досягнуто стелі. */
export async function collectNodes<Node>(
  fetchPage: (after: string | null) => Promise<Connection<Node> | null | undefined>,
  maxPages: number = MAX_PAGES,
): Promise<Node[]> {
  const nodes: Node[] = [];
  let after: string | null = null;

  for (let page = 0; page < maxPages; page += 1) {
    const connection = await fetchPage(after);
    if (!connection) break;
    nodes.push(...connection.nodes);
    if (!connection.pageInfo.hasNextPage || !connection.pageInfo.endCursor) break;
    after = connection.pageInfo.endCursor;
  }

  return nodes;
}

/**
 * Усі адреси для sitemap.xml: статичні сторінки, товари, колекції, сторінки й статті магазину.
 *
 * Будь-яка помилка Storefront API (GraphQL `errors` або відповідь без даних) кидає відповідь 502:
 * карта лише зі статичних сторінок виглядала б для пошуковика як зникнення всього каталогу.
 */
export async function loadSitemapEntries(storefrontClient: Client): Promise<SitemapEntry[]> {
  const options = (after: string | null) => ({
    variables: { first: PAGE_SIZE, after },
    cache: Cache.long(),
  });

  const [products, collections, pages, articles] = await Promise.all([
    collectNodes(
      async (after) =>
        strictData(
          "SitemapProducts",
          await storefrontClient.graphql(SITEMAP_PRODUCTS_QUERY, options(after)),
        ).products,
    ),
    collectNodes(
      async (after) =>
        strictData(
          "SitemapCollections",
          await storefrontClient.graphql(SITEMAP_COLLECTIONS_QUERY, options(after)),
        ).collections,
    ),
    collectNodes(
      async (after) =>
        strictData(
          "SitemapPages",
          await storefrontClient.graphql(SITEMAP_PAGES_QUERY, options(after)),
        ).pages,
    ),
    collectNodes(
      async (after) =>
        strictData(
          "SitemapArticles",
          await storefrontClient.graphql(SITEMAP_ARTICLES_QUERY, options(after)),
        ).articles,
    ),
  ]);

  const pageUpdatedAt = new Map(pages.map((page) => [`/pages/${page.handle}`, page.updatedAt]));
  const blogHandles = new Set(articles.map((article) => article.blog.handle));

  return [
    // Сервісна сторінка, яка вже є в магазині, отримує його дату зміни.
    ...STATIC_SITEMAP_ENTRIES.map((entry) => ({
      ...entry,
      lastmod: pageUpdatedAt.get(entry.path) ?? null,
    })),
    ...collections.map((collection) => ({
      path: `/collections/${collection.handle}`,
      lastmod: collection.updatedAt,
    })),
    ...products.map((product) => ({
      path: `/products/${product.handle}`,
      lastmod: product.updatedAt,
    })),
    ...pages.map((page) => ({ path: `/pages/${page.handle}`, lastmod: page.updatedAt })),
    ...[...blogHandles].map((handle) => ({ path: `/blogs/${handle}` })),
    ...articles.map((article) => ({
      path: `/blogs/${article.blog.handle}/${article.handle}`,
      lastmod: article.publishedAt,
    })),
  ];
}
