import type { ProductCardData } from "~/components/product/product-card";

/** Опція товару з усіма значеннями: «Пам'ять» → 256 ГБ, 512 ГБ. */
export type SavedProductOption = { name: string; values: string[] };

/** Товар з обраного чи порівняння: дані картки та характеристики для таблиці. */
export type SavedProduct = ProductCardData & {
  vendor: string | null;
  productType: string | null;
  options: SavedProductOption[];
  /** Метаполе custom.short_specs. */
  shortSpecs: string[];
};

/** Відповідь маршруту /api/saved-products. */
export type SavedProductsResponse = { products: SavedProduct[] };
export type SavedProductsError = { error: string };

/** Скільки handle приймає один запит. */
export const SAVED_PRODUCTS_PAGE_SIZE = 24;
export const SAVED_PRODUCTS_PATH = "/api/saved-products";
