import { Cache, type StorefrontApi } from "@shopify/hydrogen";

import { ARTICLES_DEMO, type ArticleCardData } from "~/components/home/articles";
import { ARTICLE_QUERY, BLOG_QUERY } from "~/graphql/queries/blog.query";
import { PAGE_QUERY } from "~/graphql/queries/page.query";
import { FALLBACK_BLOG, getFallbackArticleBody } from "~/lib/content/articles";
import { getFallbackPage, sectionsToText, type ContentBody } from "~/lib/content/pages";
import type { StorefrontGraphqlClient } from "~/lib/storefront";

import {
  hasGraphqlErrors,
  redirectToFirstPageOnError,
  requireEntity,
  upstreamErrorResponse,
} from "./errors";

type Client = StorefrontGraphqlClient;

/** Звідки взято вміст: з магазину чи із запасних даних у `~/lib/content`. */
export type ContentSource = "shopify" | "fallback";

export type ContentPageData = {
  handle: string;
  title: string;
  /** Короткий опис: meta description і вступ під заголовком запасної сторінки. */
  description: string;
  /** Заголовок для <title>, якщо його задано в SEO-полях сторінки. */
  seoTitle: string | null;
  body: ContentBody;
  updatedAt: string | null;
  source: ContentSource;
};

/** Скільки статей на сторінці списку. */
export const BLOG_PAGE_SIZE = 9;
/** Скільки статей у блоці «Читайте також». */
export const RELATED_ARTICLES = 3;
/** Середня швидкість читання, слів за хвилину. */
const WORDS_PER_MINUTE = 200;

/** HTML → звичайний текст: для підрахунку слів і коротких описів. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(text: string): number {
  const words = text.trim().split(/\s+/);
  return words[0] === "" ? 0 : words.length;
}

/** Час читання у хвилинах, щонайменше одна. */
export function readingMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
}

/**
 * Сторінка за handle. Якщо в магазині її немає, а handle належить сервісній сторінці,
 * повертається запасний вміст. `null` — сторінки не існує (маршрут відповідає 404).
 * Запасний вміст — лише коли магазин відповів без помилок, що сторінки немає:
 * на помилку Storefront API маршрут відповідає 502, а не показує заготовку замість справжнього тексту.
 */
export async function loadContentPage(
  storefrontClient: Client,
  handle: string,
): Promise<ContentPageData | null> {
  const page = requireEntity(
    "ContentPage",
    await storefrontClient.graphql(PAGE_QUERY, { variables: { handle }, cache: Cache.long() }),
    (data) => data.page,
  );

  if (page) {
    return {
      handle: page.handle,
      title: page.title,
      description: page.seo?.description || page.bodySummary,
      seoTitle: page.seo?.title || null,
      body: { kind: "html", html: page.body },
      updatedAt: page.updatedAt,
      source: "shopify",
    };
  }

  const fallback = getFallbackPage(handle);
  if (!fallback) return null;

  return {
    handle: fallback.handle,
    title: fallback.title,
    description: fallback.description,
    seoTitle: null,
    body: { kind: "sections", sections: fallback.sections },
    updatedAt: null,
    source: "fallback",
  };
}

type ArticleCardFields = NonNullable<
  StorefrontApi.ResultOf<typeof BLOG_QUERY>["blog"]
>["articles"]["nodes"][number];

function toArticleCard(article: ArticleCardFields): ArticleCardData {
  return {
    handle: article.handle,
    title: article.title,
    excerpt: article.excerpt ?? "",
    image: article.image ?? null,
    publishedAt: article.publishedAt,
  };
}

export type BlogData = {
  handle: string;
  title: string;
  description: string;
  seoTitle: string | null;
  articles: ArticleCardData[];
  /** Курсори сусідніх сторінок списку; `null` — сторінки немає. */
  newerCursor: string | null;
  olderCursor: string | null;
  /** true — це не перша сторінка списку. */
  paginated: boolean;
  source: ContentSource;
};

/**
 * Список статей блогу з курсорною пагінацією (`?after=` — старіші, `?before=` — новіші).
 * Якщо блогу `blog` у магазині немає (магазин відповів без помилок), повертаються демо-статті
 * з головної. Помилка Storefront API → 502; зіпсований курсор → перша сторінка списку.
 * `requestUrl` — адреса запиту: за нею будується перехід на першу сторінку.
 */
export async function loadBlog(
  storefrontClient: Client,
  blogHandle: string,
  searchParams: URLSearchParams,
  requestUrl?: string | URL,
): Promise<BlogData | null> {
  const before = searchParams.get("before");
  const after = searchParams.get("after");
  const variables = before
    ? { blog: blogHandle, last: BLOG_PAGE_SIZE, before }
    : { blog: blogHandle, first: BLOG_PAGE_SIZE, after };

  const result = await storefrontClient.graphql(BLOG_QUERY, { variables, cache: Cache.long() });
  if (!result.data?.blog && requestUrl) {
    redirectToFirstPageOnError("BlogArticles", result, requestUrl);
  }
  const blog = requireEntity("BlogArticles", result, (data) => data.blog);

  if (blog) {
    const { pageInfo } = blog.articles;
    return {
      handle: blog.handle,
      title: blog.title,
      description: blog.seo?.description || FALLBACK_BLOG.description,
      seoTitle: blog.seo?.title || null,
      articles: blog.articles.nodes.map(toArticleCard),
      newerCursor: pageInfo.hasPreviousPage ? (pageInfo.startCursor ?? null) : null,
      olderCursor: pageInfo.hasNextPage ? (pageInfo.endCursor ?? null) : null,
      paginated: Boolean(before || after),
      source: "shopify",
    };
  }

  if (blogHandle !== FALLBACK_BLOG.handle) return null;

  return {
    handle: FALLBACK_BLOG.handle,
    title: FALLBACK_BLOG.title,
    description: FALLBACK_BLOG.description,
    seoTitle: null,
    articles: ARTICLES_DEMO,
    newerCursor: null,
    olderCursor: null,
    paginated: false,
    source: "fallback",
  };
}

export type ArticleData = {
  blog: { handle: string; title: string };
  article: ArticleCardData & {
    body: ContentBody;
    description: string;
    seoTitle: string | null;
    authorName: string | null;
    wordCount: number;
    readingMinutes: number;
  };
  /** До трьох інших статей того самого блогу. */
  related: ArticleCardData[];
  source: ContentSource;
};

function fallbackArticle(blogHandle: string, handle: string): ArticleData | null {
  if (blogHandle !== FALLBACK_BLOG.handle) return null;
  const card = ARTICLES_DEMO.find((article) => article.handle === handle);
  const sections = getFallbackArticleBody(handle);
  if (!card || !sections) return null;
  const wordCount = countWords(sectionsToText(sections));

  return {
    blog: { handle: FALLBACK_BLOG.handle, title: FALLBACK_BLOG.title },
    article: {
      ...card,
      body: { kind: "sections", sections },
      description: card.excerpt,
      seoTitle: null,
      authorName: null,
      wordCount,
      readingMinutes: readingMinutes(wordCount),
    },
    related: ARTICLES_DEMO.filter((article) => article.handle !== handle).slice(
      0,
      RELATED_ARTICLES,
    ),
    source: "fallback",
  };
}

/**
 * Стаття з блоком «Читайте також». `null` — блогу або статті немає (404).
 * Помилка Storefront API → 502: демо-стаття не має підміняти справжню під час збою.
 */
export async function loadArticle(
  storefrontClient: Client,
  blogHandle: string,
  handle: string,
): Promise<ArticleData | null> {
  const result = await storefrontClient.graphql(ARTICLE_QUERY, {
    // На одну більше: серед свіжих може бути сама стаття.
    variables: { blog: blogHandle, handle, related: RELATED_ARTICLES + 1 },
    cache: Cache.long(),
  });
  const blog = requireEntity("BlogArticle", result, (data) => data.blog);

  // Запасні статті показуємо лише тоді, коли самого блогу в магазині немає.
  if (!blog) return fallbackArticle(blogHandle, handle);

  const article = blog.articleByHandle;
  if (!article) {
    // Блог є, статті немає: 404 лише якщо магазин не повідомив про помилку в цьому полі.
    if (hasGraphqlErrors(result)) throw upstreamErrorResponse();
    return null;
  }

  const card = toArticleCard(article);
  const wordCount = countWords(htmlToText(article.contentHtml));

  return {
    blog: { handle: blog.handle, title: blog.title },
    article: {
      ...card,
      body: { kind: "html", html: article.contentHtml },
      description: article.seo?.description || card.excerpt,
      seoTitle: article.seo?.title || null,
      authorName: article.authorV2?.name ?? null,
      wordCount,
      readingMinutes: readingMinutes(wordCount),
    },
    related: blog.articles.nodes
      .filter((node) => node.handle !== article.handle)
      .slice(0, RELATED_ARTICLES)
      .map(toArticleCard),
    source: "shopify",
  };
}
