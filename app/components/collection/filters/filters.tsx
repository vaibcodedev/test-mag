import type { ProductFilter } from "@shopify/hydrogen";
import { useId, useState, type ComponentProps } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  activeValueCount,
  isSwatchFilter,
  SORT_PARAM,
  type CollectionFilter,
} from "~/lib/shopify/collection";
import { cn } from "~/lib/utils";

import { FilterCheckboxList } from "./filter-checkbox-list";
import { FilterPrice } from "./filter-price";
import { FilterSwatchList } from "./filter-swatch-list";

export type FiltersProps = Omit<ComponentProps<"form">, "action" | "method" | "children"> & {
  /** Групи фільтрів зі Storefront API (`collection.products.filters`). */
  filters: readonly CollectionFilter[];
  /** Увімкнені фільтри з адреси. */
  activeFilters: ProductFilter[];
  /** Адреса колекції: туди йде GET-форма, коли JavaScript не працює. */
  action: string;
  currencyCode: string;
  /** Верхня межа повзунка ціни. */
  priceCeiling: number;
  /** Значення sort_by, яке форма має зберегти; для сортування за замовчуванням не передається. */
  sortValue?: string;
};

/**
 * Фільтри колекції: GET-форма з групами в акордеоні.
 * Вигляд групи залежить лише від її типу: PRICE_RANGE — повзунок і поля,
 * кольори — зразки, решта (LIST, BOOLEAN) — прапорці. Тож усе, що магазин налаштує
 * в Search & Discovery, з'явиться тут без змін у коді.
 * `onSubmit` з `useCollectionForm().formProps()` передається пропсами форми.
 */
export function Filters({
  filters,
  activeFilters,
  action,
  currencyCode,
  priceCeiling,
  sortValue,
  className,
  ...props
}: FiltersProps) {
  const id = useId();
  /** Зберігаємо згорнуті групи, а не розгорнуті: нові групи після оновлення одразу відкриті. */
  const [collapsed, setCollapsed] = useState<readonly string[]>([]);

  if (filters.length === 0) return null;

  const ids = filters.map((filter) => filter.id);
  const open = ids.filter((filterId) => !collapsed.includes(filterId));

  return (
    <form
      data-slot="filters"
      className={cn("min-w-0", className)}
      {...props}
      method="get"
      action={action}
    >
      {sortValue ? <input type="hidden" name={SORT_PARAM} value={sortValue} /> : null}
      <Accordion
        type="multiple"
        value={open}
        onValueChange={(next) => setCollapsed(ids.filter((filterId) => !next.includes(filterId)))}
      >
        {filters.map((filter, index) => {
          const labelId = `${id}-${index}-label`;
          const selected = activeValueCount(filter, activeFilters);

          return (
            <AccordionItem key={filter.id} value={filter.id} data-filter-type={filter.type}>
              <AccordionTrigger>
                <span className="flex min-w-0 items-center gap-2">
                  <span id={labelId} className="wrap-anywhere">
                    {filter.label}
                  </span>
                  {selected > 0 ? (
                    <Badge variant="count">
                      <span className="sr-only">вибрано: </span>
                      {selected}
                    </Badge>
                  ) : null}
                </span>
              </AccordionTrigger>
              {/* forceMount: поля згорнутої групи лишаються у формі, інакше її фільтри зникли б з адреси. */}
              <AccordionContent forceMount className="in-data-[state=closed]:hidden">
                {filter.type === "PRICE_RANGE" ? (
                  <FilterPrice
                    activeFilters={activeFilters}
                    currencyCode={currencyCode}
                    ceiling={priceCeiling}
                    labelId={labelId}
                  />
                ) : isSwatchFilter(filter) ? (
                  <FilterSwatchList
                    filter={filter}
                    activeFilters={activeFilters}
                    labelId={labelId}
                  />
                ) : (
                  <FilterCheckboxList
                    filter={filter}
                    activeFilters={activeFilters}
                    labelId={labelId}
                  />
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
      <noscript>
        <Button type="submit" className="mt-4 w-full">
          Застосувати фільтри
        </Button>
      </noscript>
    </form>
  );
}
