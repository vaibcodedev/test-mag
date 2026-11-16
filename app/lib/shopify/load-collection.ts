import { Cache, parseCollectionParams, type StorefrontApi } from "@shopify/hydrogen";
import type { ProductFilter as StorefrontApiProductFilter } from "@shopify/hydrogen/storefront-api-types";

import { COLLECTION_COUNT_QUERY, COLLECTION_QUERY } from "~/graphql/queries/collection.query";
import { COLLECTIONS_QUERY } from "~/graphql/queries/collections.query";
import type { StorefrontGraphqlClient } from "~/lib/storefront";

import {
  COLLECTION_COUNT_LIMIT,
  isIndexable,
  parsePageArgs,
  priceCeiling,
  toStorefrontSort,
  withPriceFilter,
  type CollectionFilter,
} from "./collection";
import { optionalData, redirectToFirstPageOnError, requireData, requireEntity } from "./errors";
import { toProductCard } from "./product-card";

const COLLECTIONS_LIMIT = 48;

type CollectionQueryVariables = StorefrontApi.VariablesOf<typeof COLLECTION_QUERY>;

/**
 * Дані сторінки колекції. Фільтри, сортування й курсор читаються з адреси,
 * тож та сама адреса завжди дає той самий HTML — і з JavaScript, і без нього.
 * Невідомий handle → 404; помилка Storefront API → 502; зіпсований курсор → перша сторінка.
 */
export async function loadCollectionPage({
  storefrontClient,
  handle,
  request,
}: {
  storefrontClient: StorefrontGraphqlClient;
  handle: string;
  request: Request;
}) {
  const url = new URL(request.url);
  const browse = parseCollectionParams(url.searchParams);
  const sort = toStorefrontSort(browse);

  // Типи фільтрів Hydrogen і згенеровані типи Storefront API описують одне й те саме.
  const filters =
    browse.filters.length > 0 ? (browse.filters as StorefrontApiProductFilter[]) : undefined;

  const variables: CollectionQueryVariables = {
    handle,
    ...parsePageArgs(url.searchParams),
    filters,
    sortKey: sort.sortKey,
    reverse: sort.reverse || undefined,
  };

  const [result, count] = await Promise.all([
    storefrontClient.graphql(COLLECTION_QUERY, { variables, cache: Cache.short() }),
    // Лічильник другорядний: без нього сторінка просто не показує «із M».
    optionalData("CollectionProductCount", () =>
      storefrontClient.graphql(COLLECTION_COUNT_QUERY, {
        variables: { handle, first: COLLECTION_COUNT_LIMIT, filters },
        cache: Cache.short(),
      }),
    ),
  ]);

  // Помилка разом із курсором в адресі — найімовірніше, курсор зіпсований або застарів.
  if (!result.data?.collection) redirectToFirstPageOnError("CollectionPage", result, url);
  const collection = requireEntity("CollectionPage", result, (page) => page.collection);
  const data = result.data;
  if (!collection || !data) throw new Response("Колекцію не знайдено", { status: 404 });

  const { products } = collection;
  const counted = count?.collection?.products;
  const available: CollectionFilter[] = products.filters.map((filter) => ({
    id: filter.id,
    label: filter.label,
    type: filter.type,
    presentation: filter.presentation,
    values: filter.values.map((value) => ({
      id: value.id,
      label: value.label,
      count: value.count,
      input: String(value.input),
      swatch: value.swatch,
    })),
  }));

  const mostExpensive = Number.parseFloat(
    collection.priceCeiling.nodes[0]?.priceRange.maxVariantPrice.amount ?? "0",
  );
  const ceiling = priceCeiling(available, Number.isFinite(mostExpensive) ? mostExpensive : 0);

  return {
    collection: {
      id: collection.id,
      handle: collection.handle,
      title: collection.title,
      description: collection.description,
      seo: collection.seo,
      image: collection.image,
    },
    products: products.nodes.map(toProductCard),
    filters: withPriceFilter(available, ceiling),
    pageInfo: products.pageInfo,
    /** null — товарів більше, ніж ми рахуємо (або лічильник не відповів): «із M» не показуємо. */
    totalCount: !counted || counted.pageInfo.hasNextPage ? null : counted.nodes.length,
    priceCeiling: ceiling,
    currencyCode: data.shop.paymentSettings.currencyCode,
    /** Рядок пошуку, для якого зібрано дані: за ним Hydrogen розуміє, що завантаження завершено. */
    dataSearch: url.searchParams.toString(),
    indexable: isIndexable(url.searchParams),
    origin: url.origin,
  };
}

export type CollectionPageData = Awaited<ReturnType<typeof loadCollectionPage>>;

export type CollectionListItem = {
  handle: string;
  title: string;
  description: string;
  image: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
};

/** Колекції для сторінки «Каталог». Колекція без фото показує фото свого першого товару. */
export async function loadCollectionsPage({
  storefrontClient,
  request,
}: {
  storefrontClient: StorefrontGraphqlClient;
  request: Request;
}): Promise<{ collections: CollectionListItem[]; origin: string }> {
  const data = requireData(
    "CollectionsList",
    await storefrontClient.graphql(COLLECTIONS_QUERY, {
      variables: { first: COLLECTIONS_LIMIT },
      cache: Cache.long(),
    }),
  );

  return {
    collections: data.collections.nodes.map((collection) => ({
      handle: collection.handle,
      title: collection.title,
      description: collection.description,
      image: collection.image ?? collection.products.nodes[0]?.featuredImage ?? null,
    })),
    origin: new URL(request.url).origin,
  };
}
