import { isFilterInputActive, type ProductFilter } from "@shopify/hydrogen";

import {
  filterParamEntries,
  productCountLabel,
  type CollectionFilter,
  type CollectionFilterValue,
} from "~/lib/shopify/collection";

export type FilterOption = {
  value: CollectionFilterValue;
  /** Назва й значення поля форми, зібрані Hydrogen із FilterValue.input. */
  name: string;
  param: string;
  checked: boolean;
  /** «12 товарів» для читачів екрана. */
  countLabel: string;
};

/** Значення групи, які можна показати прапорцем: рівно один параметр адреси на значення. */
export function filterOptions(
  filter: CollectionFilter,
  activeFilters: ProductFilter[],
): FilterOption[] {
  return filter.values.flatMap((value) => {
    const entries = filterParamEntries(value.input);
    const entry = entries[0];
    if (entries.length !== 1 || !entry) return [];

    return {
      value,
      name: entry.name,
      param: entry.value,
      checked: isFilterInputActive(activeFilters, value.input),
      countLabel: productCountLabel(value.count),
    };
  });
}

/**
 * Знімає решту значень із тим самим іменем у формі: «в наявності» й «немає» разом не вмикаються.
 * Працює з прихованими полями, які Radix Checkbox тримає у формі для її відправки.
 */
export function uncheckSiblings(input: HTMLInputElement) {
  const candidates = input.form?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]') ?? [];
  for (const candidate of candidates) {
    if (candidate !== input && candidate.name === input.name) candidate.checked = false;
  }
}
