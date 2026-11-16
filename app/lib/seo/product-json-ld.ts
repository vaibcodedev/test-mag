import type { Money } from "~/lib/format";

import { organizationId, type JsonLdObject } from "./json-ld";

const CONTEXT = "https://schema.org";

export type ProductJsonLdVideo = {
  name: string;
  /** Обкладинка відео. */
  thumbnailUrl: string;
  /** Пряма адреса файла: відео, завантажене в Shopify. */
  contentUrl?: string | null;
  /** Адреса плеєра: відео з YouTube чи Vimeo. */
  embedUrl?: string | null;
  /**
   * Дата завантаження (ISO 8601). Storefront API її для медіа не віддає, тож поки поле порожнє;
   * дату товару сюди не підставляємо — це була б вигадана дата відео.
   */
  uploadDate?: string | null;
};

export type ProductJsonLdInput = {
  handle: string;
  title: string;
  description?: string | null;
  /** Адреси всіх фото товару. */
  images?: readonly string[];
  /** Відео товару. Без обкладинки (thumbnailUrl) VideoObject не додається. */
  video?: ProductJsonLdVideo | null;
  sku?: string | null;
  brand?: string | null;
  price: Money;
  availableForSale: boolean;
  /** Вживаний пристрій: itemCondition = UsedCondition. */
  used?: boolean;
  /** Лише справжні дані відгуків. Без них AggregateRating не додається. */
  rating?: { value: number; count: number } | null;
};

export type BreadcrumbJsonLdItem = {
  title: string;
  /** Шлях на сайті: «/collections/iphone». */
  to: string;
};

/** «https://sad.ua/» → «https://sad.ua». */
function baseUrl(origin: string): string {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

/** Канонічна адреса товару: без параметрів варіанта. */
export function productCanonicalUrl(handle: string, origin: string): string {
  return `${baseUrl(origin)}/products/${handle}`;
}

/**
 * VideoObject для товару. Google для розширеного результату з відео вимагає name, thumbnailUrl
 * та uploadDate; дати в нас немає, тому розмітка лише описує відео для пошуковиків і сама
 * розширеного результату не дасть.
 */
function videoObject(
  video: ProductJsonLdVideo,
  description: string | null | undefined,
): Record<string, unknown> | null {
  const source = video.contentUrl
    ? { contentUrl: video.contentUrl }
    : video.embedUrl
      ? { embedUrl: video.embedUrl }
      : null;
  if (!source || !video.thumbnailUrl) return null;

  return {
    "@type": "VideoObject",
    name: video.name,
    ...(description ? { description } : {}),
    thumbnailUrl: [video.thumbnailUrl],
    ...source,
    ...(video.uploadDate ? { uploadDate: video.uploadDate } : {}),
  };
}

/**
 * Product + Offer; за наявності справжнього рейтингу — AggregateRating, за наявності відео
 * з обкладинкою — VideoObject у subjectOf.
 */
export function productJsonLd(product: ProductJsonLdInput, origin: string): JsonLdObject {
  const url = productCanonicalUrl(product.handle, origin);
  const images = product.images ?? [];
  const rating = product.rating && product.rating.count > 0 ? product.rating : null;
  const video = product.video ? videoObject(product.video, product.description) : null;

  return {
    "@context": CONTEXT,
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.title,
    url,
    ...(product.description ? { description: product.description } : {}),
    ...(images.length > 0 ? { image: [...images] } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.value,
            reviewCount: rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(video ? { subjectOf: video } : {}),
    offers: {
      "@type": "Offer",
      url,
      price: Number.parseFloat(product.price.amount).toFixed(2),
      priceCurrency: product.price.currencyCode,
      availability: `${CONTEXT}/${product.availableForSale ? "InStock" : "OutOfStock"}`,
      itemCondition: `${CONTEXT}/${product.used ? "UsedCondition" : "NewCondition"}`,
      seller: { "@id": organizationId(origin) },
    },
  };
}

/** Хлібні крихти: позиції з 1, абсолютні адреси. */
export function breadcrumbListJsonLd(
  items: readonly BreadcrumbJsonLdItem[],
  origin: string,
): JsonLdObject {
  const url = baseUrl(origin);

  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      item: `${url}${item.to === "/" ? "/" : item.to}`,
    })),
  };
}
