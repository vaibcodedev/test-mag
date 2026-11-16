import { cva, type VariantProps } from "class-variance-authority";

/** Основа карток товарів і плиток: без межі й тіні. */
export const cardVariants = cva("group/card relative flex min-w-0 flex-col", {
  variants: {
    size: {
      /** Картка чи плитка: радіус lg (20). */
      card: "rounded-lg",
      /** Панель-секція на всю ширину контейнера: радіус xl (24), типові поля — `panel`. */
      panel: "rounded-xl",
    },
    tone: {
      /** Біла картка на тлі сторінки. */
      surface: "bg-surface text-ink",
      /** Плитка на білій секції. */
      page: "bg-page text-ink",
      /** Темна плитка: lime дозволений лише тут. */
      ink: "bg-ink text-surface",
      /** Картка всередині ink-секції: білий 10%, світлий текст (відгуки). */
      "on-ink": "bg-on-ink-10 text-surface",
      /** Акцентна плитка-дія. */
      blue: "bg-blue text-surface",
    },
    padding: {
      /** Без полів: фото на всю ширину, поля задають частини картки. */
      none: "gap-0",
      sm: "gap-3 p-4",
      md: "gap-4 p-6",
      lg: "gap-6 p-8",
      /** Адаптивні поля панелі: 24 на телефоні, 40 від md. */
      panel: "gap-4 p-6 md:p-10",
    },
    interactive: {
      /** Hover-підйом; фото з класом lift-photo всередині збільшується. */
      true: "group lift",
      false: "",
    },
  },
  defaultVariants: {
    size: "card",
    tone: "surface",
    padding: "md",
    interactive: false,
  },
});

/** Розмір назви картки: типовий, h3 (картки статей, колекцій, контактів) і h2 панелі. */
export const cardTitleVariants = cva("", {
  variants: {
    size: {
      card: "text-card-title",
      h3: "text-h3",
      "h2-panel": "text-h2-panel",
    },
  },
  defaultVariants: { size: "card" },
});

export type CardVariants = VariantProps<typeof cardVariants>;
export type CardTitleVariants = VariantProps<typeof cardTitleVariants>;
