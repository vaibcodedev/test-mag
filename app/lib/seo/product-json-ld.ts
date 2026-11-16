import type { Money } from "~/lib/format";

import { organizationId, type JsonLdObject } from "./json-ld";

const CONTEXT = "https://schema.org";

export type ProductJsonLdInput = {
  handle: string;
  title: string;
  description?: string | null;
  /** Адреси фото товару. */
  images?: readonly string[];
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

/** Product + Offer, а за наявності справжнього рейтингу — ще й AggregateRating. */
export function productJsonLd(product: ProductJsonLdInput, origin: string): JsonLdObject {
  const url = productCanonicalUrl(product.handle, origin);
  const images = product.images ?? [];
  const rating = product.rating && product.rating.count > 0 ? product.rating : null;

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
