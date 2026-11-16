import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";

import type { CollectionPageInfo } from "~/lib/shopify/collection";

/** Частина даних loader колекції, потрібна для довантаження. */
type LoadMoreData<T> = {
  products: T[];
  pageInfo: CollectionPageInfo;
  dataSearch: string;
};

type Appended<T> = {
  /** Рядок пошуку першої сторінки, до якої довантажено товари. */
  base: string;
  products: T[];
  pageInfo: CollectionPageInfo;
};

/**
 * «Показати ще»: довантажує наступну сторінку тим самим loader і дописує товари в кінець.
 * Адреса не змінюється, тож оновлення сторінки повертає до її початку, а не до курсора посередині.
 * Варто змінити фільтр чи сортування (інший `dataSearch`) — довантажене відкидається.
 */
export function useLoadMore<T>(
  initialProducts: readonly T[],
  initialPageInfo: CollectionPageInfo,
  dataSearch: string,
) {
  const fetcher = useFetcher<LoadMoreData<T>>();
  const [appended, setAppended] = useState<Appended<T> | null>(null);
  const requested = useRef<{ base: string; search: string } | null>(null);

  useEffect(() => {
    const data = fetcher.data;
    const request = requested.current;
    if (!data || !request || data.dataSearch !== request.search) return;

    requested.current = null;
    setAppended((current) => ({
      base: request.base,
      products: [...(current?.base === request.base ? current.products : []), ...data.products],
      pageInfo: data.pageInfo,
    }));
  }, [fetcher.data]);

  const current = appended?.base === dataSearch ? appended : null;

  return {
    products: current ? [...initialProducts, ...current.products] : initialProducts,
    pageInfo: current
      ? {
          ...initialPageInfo,
          hasNextPage: current.pageInfo.hasNextPage,
          endCursor: current.pageInfo.endCursor,
        }
      : initialPageInfo,
    loading: fetcher.state !== "idle",
    /** `href` — адреса наступної сторінки, `search` — її рядок пошуку без «?». */
    loadMore: (href: string, search: string) => {
      requested.current = { base: dataSearch, search };
      void fetcher.load(href);
    },
  };
}
