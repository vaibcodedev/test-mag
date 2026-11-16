import type { MetaDescriptor } from "react-router";

const SITE_NAME = "Сад";
const TITLE_SUFFIX = ` — ${SITE_NAME}`;
const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 160;
const ELLIPSIS = "…";

/** Обрізає текст по межі слова й додає «…», якщо він довший за ліміт. */
export function truncateText(text: string, limit: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit - ELLIPSIS.length);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > limit / 2 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s.,;:—–-]+$/, "")}${ELLIPSIS}`;
}

/** Заголовок вкладки до 60 символів: «Гарантія — Сад»; назва магазину додається, коли вміщається. */
export function metaTitle(title: string): string {
  const clean = title.replace(/\s+/g, " ").trim();
  if (clean.length + TITLE_SUFFIX.length <= TITLE_LIMIT) return `${clean}${TITLE_SUFFIX}`;
  return truncateText(clean, TITLE_LIMIT);
}

export type ContentMetaInput = {
  title: string;
  description: string;
  /** Канонічний шлях: «/pages/warranty». */
  path: string;
  origin: string;
  type?: "website" | "article";
  image?: string | null;
  /** Дата публікації статті в ISO 8601. */
  publishedAt?: string | null;
  /** Сторінки, яких не має бути в пошуку: наступні сторінки списку, кабінет. */
  noindex?: boolean;
};

/** Meta контентної сторінки: title, description, canonical, hreflang і Open Graph. */
export function contentMeta({
  title,
  description,
  path,
  origin,
  type = "website",
  image,
  publishedAt,
  noindex = false,
}: ContentMetaInput): MetaDescriptor[] {
  const url = `${origin}${path}`;
  const pageTitle = metaTitle(title);
  const pageDescription = truncateText(description, DESCRIPTION_LIMIT);

  return [
    { title: pageTitle },
    { name: "description", content: pageDescription },
    ...(noindex ? [{ name: "robots", content: "noindex, follow" }] : []),
    { tagName: "link", rel: "canonical", href: url },
    { tagName: "link", rel: "alternate", hrefLang: "uk", href: url },
    { property: "og:type", content: type },
    { property: "og:locale", content: "uk_UA" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: pageTitle },
    { property: "og:description", content: pageDescription },
    { property: "og:url", content: url },
    ...(image ? [{ property: "og:image", content: image }] : []),
    ...(type === "article" && publishedAt
      ? [{ property: "article:published_time", content: publishedAt }]
      : []),
  ];
}
