import { cva, type VariantProps } from "class-variance-authority";

/** Коло з фото або ініціалами. Тон задає тло під ініціалами. */
export const avatarVariants = cva(
  "group/avatar relative flex shrink-0 rounded-pill font-semibold select-none",
  {
    variants: {
      size: {
        /** 32 */
        sm: "size-8 text-caption",
        /** 44 */
        md: "size-11 text-small",
        /** 52 */
        lg: "size-13 text-body",
      },
      tone: {
        /** На білій картці чи тлі сторінки: ink, білі ініціали. */
        ink: "bg-ink text-surface",
        /** Спокійний: page, ініціали ink. Лише на білому. */
        page: "bg-page text-ink",
      },
    },
    defaultVariants: { size: "md", tone: "ink" },
  },
);

export type AvatarVariants = VariantProps<typeof avatarVariants>;
