import type { ComponentProps } from "react";

import { Pagination } from "~/components/layout/pagination";
import type { ProductCardData } from "~/components/product/product-card";
import { ProductGrid } from "~/components/product/product-grid";
import type { SearchPagination } from "~/lib/search";
import { cn } from "~/lib/utils";

export type SearchResultsProps = Omit<ComponentProps<"div">, "children"> & {
  products: readonly ProductCardData[];
  pagination: SearchPagination;
  /** Відкривається інша сторінка результатів: старі товари лишаються, приглушені. */
  pending?: boolean;
  onAddToCart?: (product: ProductCardData) => void;
  /** handle товару, який зараз додається в кошик. */
  addingHandle?: string | null;
};

/** Сітка знайдених товарів (2 / 3 / 4 / 5 колонок) і перехід між сторінками. */
export function SearchResults({
  products,
  pagination,
  pending = false,
  onAddToCart,
  addingHandle,
  className,
  ...props
}: SearchResultsProps) {
  return (
    <div data-slot="search-results" className={cn("flex flex-col gap-8", className)} {...props}>
      <ProductGrid
        data-testid="product-grid"
        products={products}
        columns="full"
        headingLevel="h3"
        pending={pending}
        onAddToCart={onAddToCart}
        addingHandle={addingHandle}
      />
      <Pagination
        aria-label="Сторінки результатів"
        previousHref={pagination.previousHref}
        nextHref={pagination.nextHref}
        prefetch="intent"
      />
    </div>
  );
}
