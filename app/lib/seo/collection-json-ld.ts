import type { ProductCardData } from "~/components/product/product-card";

import { itemListJsonLd, type JsonLdObject } from "./json-ld";

/** Крихта: назва й шлях від кореня сайту («/collections/iphone»). */
export type CatalogCrumb = { title: string; to: string };

const HOME_CRUMB: CatalogCrumb = { title: "Головна", to: "/" };
export const CATALOG_CRUMB: CatalogCrumb = { title: "Каталог", to: "/collections" };

function baseUrl(origin: string): string {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

/** Головна → Каталог. */
export function catalogCrumbs(): CatalogCrumb[] {
  return [HOME_CRUMB, CATALOG_CRUMB];
}

/** Головна → Каталог → колекція. */
export function collectionCrumbs(collection: { handle: string; title: string }): CatalogCrumb[] {
  return [
    HOME_CRUMB,
    CATALOG_CRUMB,
    { title: collection.title, to: `/collections/${collection.handle}` },
  ];
}

/** BreadcrumbList із тих самих крихт, що показані на сторінці. */
export function catalogBreadcrumbJsonLd(
  crumbs: readonly CatalogCrumb[],
  origin: string,
): JsonLdObject {
  const url = baseUrl(origin);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.title,
      item: `${url}${crumb.to}`,
    })),
  };
}

/** ItemList товарів, які видно на сторінці колекції. */
export function collectionItemListJsonLd(
  collection: { handle: string; title: string },
  products: ProductCardData[],
  origin: string,
): JsonLdObject {
  return {
    ...itemListJsonLd(products, origin, collection.title),
    url: `${baseUrl(origin)}/collections/${collection.handle}`,
  };
}
