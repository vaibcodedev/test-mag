import { Cache, parseCollectionParams, type StorefrontApi } from "@shopify/hydrogen";
import type { ProductFilter as StorefrontApiProductFilter } from "@shopify/hydrogen/storefront-api-types";

import type { ProductCardData } from "~/components/product/product-card";
import { SEARCH_QUERY } from "~/graphql/queries/search.query";
import { SEARCH_PATH } from "~/lib/search-path";
import { pageHrefs, type CollectionPageInfo, type PageHrefs } from "~/lib/shopify/collection";
import { redirectToFirstPageOnError, requireData } from "~/lib/shopify/errors";
import { toProductCard } from "~/lib/shopify/product-card";
import type { StorefrontGraphqlClient } from "~/lib/storefront";

/** 20 карток — це повні ряди в сітці на 2, 4 і 5 колонок. */
export const SEARCH_PAGE_SIZE = 20;
export { SEARCH_PATH };

type SearchQueryResult = StorefrontApi.ResultOf<typeof SEARCH_QUERY>;
type SearchQueryVariables = StorefrontApi.VariablesOf<typeof SEARCH_QUERY>;
type SearchNode = SearchQueryResult["search"]["nodes"][number];
type SearchProductNode = Extract<SearchNode, { __typename: "Product" }>;

/** Посилання на сусідні сторінки результатів; працюють і без JavaScript. */
export type SearchPagination = PageHrefs;

export type SearchPageData = {
  /** false — запиту ще немає: показуємо запрошення до пошуку, а не «нічого не знайшли». */
  performed: boolean;
  searchTerm: string;
  products: ProductCardData[];
  totalCount: number;
  pagination: SearchPagination;
  origin: string;
};

/**
 * Адреси попередньої й наступної сторінок. Запит, сортування та фільтри з поточної адреси
 * зберігаються, змінюється лише курсор.
 */
export function searchPagination(
  searchParams: URLSearchParams,
  pageInfo: CollectionPageInfo,
): SearchPagination {
  return pageHrefs(SEARCH_PATH, searchParams.toString(), pageInfo);
}

/**
 * Результати пошуку. Помилка Storefront API → 502; зіпсований курсор (`?after=…`) →
 * перехід на першу сторінку тих самих результатів.
 */
export async function loadSearchPage({
  storefrontClient,
  request,
}: {
  storefrontClient: StorefrontGraphqlClient;
  request: Request;
}): Promise<SearchPageData> {
  const url = new URL(request.url);
  const searchTerm = (url.searchParams.get("q") ?? "").trim();

  if (!searchTerm) {
    return {
      performed: false,
      searchTerm,
      products: [],
      totalCount: 0,
      pagination: { previousHref: null, nextHref: null },
      origin: url.origin,
    };
  }

  const browse = parseCollectionParams(url.searchParams);
  const after = url.searchParams.get("after") || undefined;
  const before = after ? undefined : url.searchParams.get("before") || undefined;
  const sortKey = browse.sortKey === "PRICE" ? "PRICE" : "RELEVANCE";

  const variables: SearchQueryVariables = {
    term: searchTerm,
    ...(before ? { last: SEARCH_PAGE_SIZE, before } : { first: SEARCH_PAGE_SIZE, after }),
    productFilters:
      browse.filters.length > 0 ? (browse.filters as StorefrontApiProductFilter[]) : undefined,
    sortKey,
    reverse: sortKey === "PRICE" ? browse.reverse || undefined : undefined,
  };

  const result = await storefrontClient.graphql(SEARCH_QUERY, { variables, cache: Cache.short() });
  if (!result.data?.search) redirectToFirstPageOnError("SearchPage", result, url);
  const data = requireData("SearchPage", result);

  const products = data.search.nodes
    .filter((node): node is SearchProductNode => node.__typename === "Product")
    .map(toProductCard);

  return {
    performed: true,
    searchTerm,
    products,
    totalCount: data.search.totalCount,
    pagination: searchPagination(url.searchParams, data.search.pageInfo),
    origin: url.origin,
  };
}
