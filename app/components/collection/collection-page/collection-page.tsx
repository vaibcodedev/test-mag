import { getSortByValue } from "@shopify/hydrogen";
import { useCollection, useCollectionForm } from "@shopify/hydrogen/react";
import { useId } from "react";
import { useLocation, useNavigation } from "react-router";

import { ActiveFilters } from "~/components/collection/active-filters";
import { CollectionHeader, type Crumb } from "~/components/collection/collection-header";
import { Filters } from "~/components/collection/filters";
import { FiltersSheet } from "~/components/collection/filters-sheet";
import { CollectionEmpty } from "~/components/collection/collection-empty";
import { SortSelect } from "~/components/collection/sort-select";
import { Container } from "~/components/layout/container";
import { Pagination, useLoadMore } from "~/components/layout/pagination";
import { ProductGrid, ProductGridSkeleton } from "~/components/product/product-grid";
import { Card } from "~/components/ui/card";
import { useAddToCart } from "~/hooks/use-add-to-cart";
import {
  activeFilterChips,
  activeFilterParams,
  COLLECTION_COUNT_LIMIT,
  COLLECTION_PAGE_SIZE,
  collectionPath,
  pageHrefs,
  productCountLabel,
  sortSelectValue,
} from "~/lib/shopify/collection";
import type { CollectionPageData } from "~/lib/shopify/load-collection";
import { cn } from "~/lib/utils";

import { CollectionViewedTracker } from "./collection-viewed-tracker";

const COLLECTIONS_PREFIX = "/collections/";

export type CollectionPageProps = {
  /** Дані з loader маршруту /collections/:handle. */
  data: CollectionPageData;
  /** Крихти від головної до цієї колекції. */
  crumbs: readonly Crumb[];
};

/**
 * Сторінка колекції: шапка, фільтри, сортування, сітка товарів і пагінація.
 * Має стояти всередині <CollectionProvider>: стан фільтрів і сортування веде Hydrogen,
 * а товари й доступні фільтри приходять із loader.
 */
export function CollectionPage({ data, crumbs }: CollectionPageProps) {
  const { collection, filters, currencyCode, totalCount, priceCeiling } = data;
  const state = useCollection();
  const { formProps } = useCollectionForm();
  const location = useLocation();
  const navigation = useNavigation();
  const filtersTitleId = useId();
  const { addToCart, addingHandle } = useAddToCart();
  const { products, pageInfo, loading, loadMore } = useLoadMore(
    data.products,
    data.pageInfo,
    data.dataSearch,
  );

  const path = collectionPath(collection.handle);
  const nextLocation = navigation.state === "loading" ? navigation.location : null;
  const nextPath = nextLocation?.pathname ?? null;
  /** Відкривається інша колекція: показуємо заглушки замість чужих товарів. */
  const leaving =
    nextPath !== null && nextPath !== location.pathname && nextPath.startsWith(COLLECTIONS_PREFIX);
  /** Змінився фільтр, сортування чи сторінка цієї ж колекції: старі товари лишаються, приглушені. */
  const pending =
    state.status === "loading" ||
    (nextPath === location.pathname && nextLocation?.search !== location.search);

  const { chips, clearHref } = activeFilterChips(state, filters, currencyCode, path);
  const hasFilters = filters.length > 0;
  const filtered = state.filters.length > 0;
  const remaining =
    totalCount === null ? COLLECTION_PAGE_SIZE : Math.max(totalCount - products.length, 0);

  const countLabel =
    totalCount === null
      ? `Понад ${productCountLabel(COLLECTION_COUNT_LIMIT)}`
      : productCountLabel(totalCount);
  const applyLabel =
    totalCount === null
      ? "Показати товари"
      : totalCount === 0
        ? "Товарів не знайдено"
        : `Показати ${productCountLabel(totalCount)}`;

  const filtersForm = (
    <Filters
      {...formProps()}
      filters={filters}
      activeFilters={state.filters}
      action={path}
      currencyCode={currencyCode}
      priceCeiling={priceCeiling}
      sortValue={state.sortKey ? getSortByValue(state.sortKey, state.reverse) : undefined}
    />
  );

  return (
    <Container data-slot="collection-page" className="flex flex-col gap-6 md:gap-8">
      <CollectionViewedTracker collection={collection} />
      <CollectionHeader
        crumbs={crumbs}
        title={collection.title}
        description={collection.description}
        count={countLabel}
      />

      <div
        className={cn(
          "flex flex-col gap-4",
          hasFilters && "lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-6",
        )}
      >
        {hasFilters ? (
          // На телефоні фільтри живуть у шухляді; без JavaScript шухляда не відкриється,
          // тому тоді (noscript:) колонка показується одразу над товарами.
          <Card
            asChild
            padding="none"
            className="hidden px-5 py-1 lg:sticky lg:top-28 lg:block lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto noscript:block"
          >
            <aside aria-labelledby={filtersTitleId}>
              <h2 id={filtersTitleId} className="sr-only">
                Фільтри
              </h2>
              {filtersForm}
            </aside>
          </Card>
        ) : null}

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-center gap-3">
            {hasFilters ? (
              <FiltersSheet
                activeCount={chips.length}
                applyLabel={applyLabel}
                clearHref={clearHref}
                pending={pending}
                className="flex-1 sm:flex-none lg:hidden noscript:hidden"
              >
                {filtersForm}
              </FiltersSheet>
            ) : null}
            <SortSelect
              {...formProps()}
              value={sortSelectValue(state)}
              action={path}
              hiddenParams={activeFilterParams(state.filters)}
              className="flex-1 sm:ms-auto sm:max-w-64"
            />
          </div>

          <ActiveFilters chips={chips} clearHref={clearHref} />

          <h2 className="sr-only">Товари</h2>
          {leaving ? (
            <ProductGridSkeleton columns="sidebar" />
          ) : products.length > 0 ? (
            <ProductGrid
              products={products}
              columns="sidebar"
              pending={pending}
              loadingMore={loading ? Math.min(remaining, COLLECTION_PAGE_SIZE) : 0}
              onAddToCart={addToCart}
              addingHandle={addingHandle}
            />
          ) : (
            <CollectionEmpty filtered={filtered} resetHref={clearHref} />
          )}

          {leaving ? null : (
            <Pagination
              aria-label="Сторінки каталогу"
              {...pageHrefs(path, location.search, pageInfo)}
              showMore
              shownCount={products.length}
              totalCount={totalCount}
              loading={loading}
              onLoadMore={loadMore}
              className="mt-4"
            />
          )}
        </div>
      </div>
    </Container>
  );
}
