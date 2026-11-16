import {
  getPredictiveSearchItemUrl,
  getSearchResultUrl,
  type PredictiveSearchData,
} from "@shopify/hydrogen";

import type { Money } from "~/lib/format";
import { routeTemplates } from "~/lib/route-templates";

export const SEARCH_PAGE_PATH = "/search";

export type PredictiveOptionImage = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

/** Один рядок у списку підказок. `id` — це й DOM-id опції для aria-activedescendant. */
export type PredictiveOption = {
  id: string;
  kind: "product" | "collection" | "query" | "all";
  title: string;
  href: string;
  image?: PredictiveOptionImage | null;
  price?: Money | null;
};

export type PredictiveGroup = {
  key: "queries" | "products" | "collections";
  heading: string;
  options: PredictiveOption[];
};

export type PredictiveOptions = {
  groups: PredictiveGroup[];
  /** Рядок «Усі результати за запитом …»; null, коли запит порожній. */
  all: PredictiveOption | null;
  /** Усі опції в порядку показу: ним ходять стрілки. */
  flat: PredictiveOption[];
};

type PredictiveItems = Pick<PredictiveSearchData["items"], "products" | "collections" | "queries">;

/** Адреса повної сторінки результатів для запиту. */
export function searchPageUrl(term: string): string {
  return getSearchResultUrl({ baseUrl: SEARCH_PAGE_PATH, term });
}

/**
 * Відповідь predictive search → групи опцій для списку.
 * Адреси будує Hydrogen: вони зберігають trackingParameters і сам запит для атрибуції.
 *
 * @param idPrefix унікальний префікс DOM-id (на сторінці може бути два поля пошуку).
 * @param resultTerm запит, для якого прийшли підказки.
 * @param typedTerm те, що зараз у полі: воно йде в рядок «Усі результати».
 */
export function buildPredictiveOptions(
  items: PredictiveItems,
  { idPrefix, resultTerm, typedTerm }: { idPrefix: string; resultTerm: string; typedTerm: string },
): PredictiveOptions {
  const queries: PredictiveOption[] = items.queries.map((query, index) => ({
    id: `${idPrefix}-query-${index}`,
    kind: "query",
    title: query.text,
    href: getPredictiveSearchItemUrl(query, { routes: routeTemplates }),
  }));

  const products: PredictiveOption[] = items.products.map((product, index) => {
    const variant = product.selectedOrFirstAvailableVariant;
    return {
      id: `${idPrefix}-product-${index}`,
      kind: "product",
      title: product.title,
      href: getPredictiveSearchItemUrl(product, { routes: routeTemplates, term: resultTerm }),
      image: variant?.image ?? null,
      price: variant?.price ?? null,
    };
  });

  const collections: PredictiveOption[] = items.collections.map((collection, index) => ({
    id: `${idPrefix}-collection-${index}`,
    kind: "collection",
    title: collection.title,
    href: getPredictiveSearchItemUrl(collection, { routes: routeTemplates, term: resultTerm }),
    image: collection.image,
  }));

  const groups: PredictiveGroup[] = [
    { key: "queries" as const, heading: "Часто шукають", options: queries },
    { key: "products" as const, heading: "Товари", options: products },
    { key: "collections" as const, heading: "Категорії", options: collections },
  ].filter((group) => group.options.length > 0);

  const trimmed = typedTerm.trim();
  const all: PredictiveOption | null = trimmed
    ? {
        id: `${idPrefix}-all`,
        kind: "all",
        title: `Усі результати за запитом «${trimmed}»`,
        href: searchPageUrl(trimmed),
      }
    : null;

  return {
    groups,
    all,
    flat: [...groups.flatMap((group) => group.options), ...(all ? [all] : [])],
  };
}
