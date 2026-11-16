import { AnalyticsEvent } from "@shopify/hydrogen";
import { useEffect } from "react";
import { useNavigation } from "react-router";

import { Container } from "~/components/layout/container";
import type { ProductCardData } from "~/components/product/product-card";
import { PredictiveSearch } from "~/components/search/predictive-search";
import { SearchEmpty } from "~/components/search/search-empty";
import { SearchResults } from "~/components/search/search-results";
import { CATALOG_LINKS } from "~/lib/content/site";
import { plural } from "~/lib/format";
import type { SearchPageData } from "~/lib/search";
import { SEARCH_PATH } from "~/lib/search-path";

export type SearchPageProps = {
  data: SearchPageData;
  onAddToCart?: (product: ProductCardData) => void;
  addingHandle?: string | null;
};

function countLabel(count: number) {
  return `Знайшли ${count} ${plural(count, { one: "товар", few: "товари", many: "товарів" })}`;
}

/** Подія перегляду результатів пошуку для аналітики Shopify. */
function useSearchViewed(searchTerm: string, totalCount: number) {
  useEffect(() => {
    if (!searchTerm) return;

    window.Shopify?.analytics?.publish(AnalyticsEvent.SEARCH_VIEWED, {
      searchTerm,
      searchResults: { totalCount },
    });
  }, [searchTerm, totalCount]);
}

/** Сторінка /search: заголовок, поле з підказками, кількість, сітка товарів або порожній стан. */
export function SearchPage({ data, onAddToCart, addingHandle }: SearchPageProps) {
  const { searchTerm, performed, products, totalCount, pagination } = data;
  const hasResults = products.length > 0;
  const navigation = useNavigation();
  /** Відкривається інший запит чи сторінка результатів: старі товари лишаються, приглушені. */
  const pending = navigation.state === "loading" && navigation.location?.pathname === SEARCH_PATH;

  useSearchViewed(performed ? searchTerm : "", totalCount);

  return (
    <Container data-slot="search-page" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-h2 break-words text-ink">
          {performed ? `Пошук: «${searchTerm}»` : "Пошук"}
        </h1>
        {/* key: після переходу на інший запит поле показує саме його. */}
        <PredictiveSearch
          key={searchTerm}
          defaultTerm={searchTerm}
          initialFocus={!performed}
          label="Запит для пошуку"
          className="max-w-2xl"
          fieldClassName="h-14"
        />
        {performed && hasResults ? (
          <p role="status" className="text-body text-ink-2">
            {countLabel(totalCount)}
          </p>
        ) : null}
      </div>

      {hasResults ? (
        <section aria-labelledby="search-results-title">
          <h2 id="search-results-title" className="sr-only">
            Знайдені товари
          </h2>
          <SearchResults
            products={products}
            pagination={pagination}
            pending={pending}
            onAddToCart={onAddToCart}
            addingHandle={addingHandle}
          />
        </section>
      ) : (
        <SearchEmpty term={performed ? searchTerm : undefined} categories={CATALOG_LINKS} />
      )}
    </Container>
  );
}
