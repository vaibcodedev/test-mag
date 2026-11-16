import { cva, type VariantProps } from "class-variance-authority";

export const productGridVariants = cva("grid grid-cols-2 gap-3", {
  variants: {
    columns: {
      /** На всю ширину сторінки: 2 / 3 / 4 / 5 колонок (пошук). */
      full: "md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5",
      /** Поруч із колонкою фільтрів: 2 / 3 / 4 колонки (колекція). */
      sidebar: "md:grid-cols-3 xl:grid-cols-4",
    },
  },
  defaultVariants: { columns: "full" },
});

export type ProductGridColumns = NonNullable<VariantProps<typeof productGridVariants>["columns"]>;

/** Скільки карток у першому рядку найширшої сітки: їхні фото вантажаться без lazy. */
export const FIRST_ROW_COUNT: Record<ProductGridColumns, number> = { full: 5, sidebar: 4 };
