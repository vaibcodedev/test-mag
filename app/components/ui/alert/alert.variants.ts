import { cva, type VariantProps } from "class-variance-authority";

/**
 * Повідомлення в потоці сторінки. Пастельних заливок немає: стан передають
 * межа й іконка, а текст лишається ink заради контрасту.
 */
export const alertVariants = cva(
  "group/alert relative grid w-full gap-y-1 rounded-md border px-4 py-3 text-start text-small has-data-[slot=alert-action]:pe-14 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 [&>svg]:row-span-2 [&>svg]:size-5 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Нейтральна підказка на білій картці. */
        info: "border-transparent bg-page text-ink [&>svg]:text-ink-2",
        /** Дія вдалася: «Промокод застосовано». */
        success: "border-success bg-surface text-ink [&>svg]:text-success",
        /** Варто звернути увагу: «Залишився 1 товар». */
        warning: "border-star bg-surface text-ink [&>svg]:text-ink",
        /** Помилка: що сталося і як це виправити. */
        danger: "border-danger bg-surface text-ink [&>svg]:text-danger",
        /** На ink. */
        "on-dark": "border-transparent bg-on-ink-10 text-surface [&>svg]:text-lime",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

export type AlertVariants = VariantProps<typeof alertVariants>;
