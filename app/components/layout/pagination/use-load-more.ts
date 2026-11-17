import { useEffect, useState } from "react";
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

/** Запит, на відповідь якого чекаємо. */
type Requested = { base: string; search: string; started: boolean };

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
  const [requested, setRequested] = useState<Requested | null>(null);

  useEffect(() => {
    if (!requested) return;
    // Спершу чекаємо, доки запит справді піде: одразу після натискання fetcher ще «idle»
    // зі старими даними, і завершувати на них не можна.
    if (fetcher.state !== "idle") {
      if (!requested.started) setRequested({ ...requested, started: true });
      return;
    }
    if (!requested.started) return;

    const data = fetcher.data;
    // Запит завершився. Знімаємо «завантаження» тим самим оновленням, що й дописує товари:
    // інакше заглушки зникали б на мить раніше, ніж з'являться картки, і сітка блимала б.
    setRequested(null);
    // Немає відповіді на цей запит (збій мережі) — лишаємо список як був.
    if (!data || data.dataSearch !== requested.search) return;
    setAppended((current) => ({
      base: requested.base,
      products: [...(current?.base === requested.base ? current.products : []), ...data.products],
      pageInfo: data.pageInfo,
    }));
  }, [fetcher.state, fetcher.data, requested]);

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
    loading: fetcher.state !== "idle" || requested !== null,
    /** `href` — адреса наступної сторінки, `search` — її рядок пошуку без «?». */
    loadMore: (href: string, search: string) => {
      setRequested({ base: dataSearch, search, started: false });
      void fetcher.load(href);
    },
  };
}
