import { cva, type VariantProps } from "class-variance-authority";

/** Порожній стан на білій панелі: зліва за замовчуванням, по центру — з `centered`. */
export const emptyVariants = cva(
  "group/empty flex w-full min-w-0 flex-col gap-4 rounded-xl bg-surface text-ink",
  {
    variants: {
      size: {
        /** Порожня сторінка: кошик, обране, результати пошуку. */
        md: "p-8 md:p-12",
        /** Порожня панель: шухляда кошика, блок у кабінеті. */
        sm: "p-6",
      },
      centered: {
        true: "items-center text-center",
        false: "items-start text-start",
      },
    },
    defaultVariants: {
      size: "md",
      centered: false,
    },
  },
);

export type EmptyVariants = VariantProps<typeof emptyVariants>;
