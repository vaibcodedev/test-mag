import { cva, type VariantProps } from "class-variance-authority";

/* tone: ink — на темній панелі (цифри lime); light — на білому чи сірому тлі. */

/** Підпис над відліком і назви одиниць. */
export const countdownLabelVariants = cva("", {
  variants: { tone: { ink: "text-on-ink-muted", light: "text-ink-2" } },
  defaultVariants: { tone: "ink" },
});

/** Плитка однієї одиниці часу. */
export const countdownCellVariants = cva(
  "flex min-w-16 flex-col-reverse items-center gap-1 rounded-md px-2 py-3",
  {
    variants: { tone: { ink: "bg-on-ink-10", light: "bg-page" } },
    defaultVariants: { tone: "ink" },
  },
);

/** Число в плитці. */
export const countdownValueVariants = cva("text-h3 tabular-nums", {
  variants: { tone: { ink: "text-lime", light: "text-ink" } },
  defaultVariants: { tone: "ink" },
});

/** Текст «Акцію завершено». */
export const countdownFinishedVariants = cva("text-body font-semibold", {
  variants: { tone: { ink: "text-surface", light: "text-ink" } },
  defaultVariants: { tone: "ink" },
});

export type CountdownTone = NonNullable<VariantProps<typeof countdownCellVariants>["tone"]>;
