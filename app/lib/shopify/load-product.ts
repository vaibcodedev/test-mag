import { Cache, getSelectedProductOptions } from "@shopify/hydrogen";

import type { ProductCardData } from "~/components/product/product-card";
import { PRODUCT_QUERY, PRODUCT_RECOMMENDATIONS_QUERY } from "~/graphql/queries/product.query";
import type { StorefrontGraphqlClient } from "~/lib/storefront";

import { optionalData, requireEntity } from "./errors";
import type { ProductPageData } from "./product";
import { toProductCard } from "./product-card";

const RELATED_LIMIT = 4;

export type ProductPage = {
  product: ProductPageData;
  related: ProductCardData[];
};

/** Рекомендації не мають ламати сторінку: без них секція «Схожі товари» просто не показується. */
async function loadRelatedProducts(
  storefrontClient: StorefrontGraphqlClient,
  handle: string,
): Promise<ProductCardData[]> {
  const data = await optionalData("ProductRecommendations", () =>
    storefrontClient.graphql(PRODUCT_RECOMMENDATIONS_QUERY, {
      variables: { handle },
      cache: Cache.short(),
    }),
  );

  return (data?.productRecommendations ?? [])
    .filter((product) => product.handle !== handle)
    .slice(0, RELATED_LIMIT)
    .map(toProductCard);
}

/**
 * Дані сторінки товару. Вибраний варіант читається з параметрів адреси,
 * тому посиланням на конкретний варіант можна поділитися.
 * Товару немає (без помилок API) — `null`, маршрут відповідає 404; помилка Storefront API — 502.
 */
export async function loadProductPage(
  storefrontClient: StorefrontGraphqlClient,
  handle: string,
  searchParams: URLSearchParams,
): Promise<ProductPage | null> {
  const selectedOptions = getSelectedProductOptions({ searchParams });
  const [result, related] = await Promise.all([
    storefrontClient.graphql(PRODUCT_QUERY, {
      variables: { handle, selectedOptions },
      cache: Cache.short(),
    }),
    loadRelatedProducts(storefrontClient, handle),
  ]);

  const product = requireEntity("ProductPage", result, (data) => data.product);
  return product ? { product, related } : null;
}
