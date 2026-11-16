import { cva, type VariantProps } from "class-variance-authority";

/** Основа карток товарів і плиток: радіус lg, без межі й тіні. */
export const cardVariants = cva("group/card relative flex min-w-0 flex-col rounded-lg", {
  variants: {
    tone: {
      /** Біла картка на тлі сторінки. */
      surface: "bg-surface text-ink",
      /** Плитка на білій секції. */
      page: "bg-page text-ink",
      /** Темна плитка: lime дозволений лише тут. */
      ink: "bg-ink text-surface",
      /** Акцентна плитка-дія. */
      blue: "bg-blue text-surface",
    },
    padding: {
      /** Без полів: фото на всю ширину, поля задають частини картки. */
      none: "gap-0",
      sm: "gap-3 p-4",
      md: "gap-4 p-6",
      lg: "gap-6 p-8",
    },
    interactive: {
      /** Hover-підйом; фото з класом lift-photo всередині збільшується. */
      true: "group lift",
      false: "",
    },
  },
  defaultVariants: {
    tone: "surface",
    padding: "md",
    interactive: false,
  },
});

export type CardVariants = VariantProps<typeof cardVariants>;
