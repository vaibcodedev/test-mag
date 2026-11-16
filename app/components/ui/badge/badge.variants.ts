import { cva, type VariantProps } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 rounded-sm px-2 text-caption font-semibold whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-4",
  {
    variants: {
      variant: {
        /** «Новинка». */
        new: "bg-blue text-surface",
        /** «Хіт». */
        hit: "bg-ink text-surface",
        /** «Топ». */
        top: "bg-ink text-surface",
        /** Тільки знижки: «−8%». */
        sale: "bg-sale text-surface tabular-nums",
        /** Стан уживаного пристрою. */
        grade: "bg-page text-ink",
        outline: "border border-line bg-surface text-ink-2",
        /** Лічильник: товари в кошику, вибрані фільтри. */
        count: "h-5 min-w-5 rounded-pill bg-blue px-1.5 text-surface tabular-nums",
        /** Лічильник на синій кнопці: біла пігулка, синє число. */
        "count-on-blue": "h-5 min-w-5 rounded-pill bg-surface px-1.5 text-blue tabular-nums",
        /** Чип з умовою чи характеристикою на білій картці: «4 800 ₴ × 25 міс.», «256 ГБ». */
        chip: "h-7 justify-start gap-1.5 bg-page px-2.5 font-medium text-ink-2 tabular-nums [&>svg]:shrink-0",
        /** Чип на тлі сторінки. */
        "chip-surface":
          "h-7 justify-start gap-1.5 bg-surface px-2.5 font-medium text-ink-2 tabular-nums [&>svg]:shrink-0",
        /** Чип на ink: характеристики в hero. */
        "chip-on-dark":
          "h-7 justify-start gap-1.5 bg-on-ink-10 px-2.5 font-medium text-surface tabular-nums [&>svg]:shrink-0",
      },
    },
    defaultVariants: {
      variant: "new",
    },
  },
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
