import { cva, type VariantProps } from "class-variance-authority";

export const progressVariants = cva("relative h-1.5 w-full overflow-hidden rounded-pill", {
  variants: {
    tone: {
      /** На світлому тлі. */
      light: "bg-line",
      /** На ink: заповнення lime. */
      "on-dark": "bg-on-ink-20",
    },
  },
  defaultVariants: { tone: "light" },
});

export const progressIndicatorVariants = cva(
  "size-full rounded-pill transition-transform duration-300 ease-soft",
  {
    variants: {
      tone: {
        light: "bg-blue",
        "on-dark": "bg-lime",
      },
    },
    defaultVariants: { tone: "light" },
  },
);

export type ProgressVariants = VariantProps<typeof progressVariants>;
