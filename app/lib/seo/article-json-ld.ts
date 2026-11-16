import { organizationId, type JsonLdObject } from "./json-ld";

const CONTEXT = "https://schema.org";
const LANGUAGE = "uk-UA";

export type ArticleJsonLdInput = {
  /** Шлях статті на сайті: «/blogs/blog/yakyi-iphone-kupyty». */
  path: string;
  title: string;
  description?: string | null;
  image?: string | null;
  /** Дата публікації в ISO 8601. */
  publishedAt: string;
  /** Дата останньої зміни; якщо її немає, береться дата публікації. */
  modifiedAt?: string | null;
  authorName?: string | null;
  wordCount?: number | null;
};

/** «https://sad.ua/» → «https://sad.ua». */
function baseUrl(origin: string): string {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

/** Стаття блогу: Article з видавцем-організацією. Автор без імені — сама організація. */
export function articleJsonLd(article: ArticleJsonLdInput, origin: string): JsonLdObject {
  const url = `${baseUrl(origin)}${article.path}`;
  const organization = { "@id": organizationId(origin) };

  return {
    "@context": CONTEXT,
    "@type": "Article",
    "@id": `${url}#article`,
    headline: article.title,
    url,
    mainEntityOfPage: url,
    inLanguage: LANGUAGE,
    datePublished: article.publishedAt,
    dateModified: article.modifiedAt ?? article.publishedAt,
    ...(article.description ? { description: article.description } : {}),
    ...(article.image ? { image: [article.image] } : {}),
    ...(article.wordCount ? { wordCount: article.wordCount } : {}),
    author: article.authorName ? { "@type": "Person", name: article.authorName } : organization,
    publisher: organization,
  };
}
