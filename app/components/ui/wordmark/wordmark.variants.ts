import { cva, type VariantProps } from "class-variance-authority";

export const wordmarkVariants = cva(
  "inline-flex items-baseline font-display leading-none font-semibold tracking-(--tracking-hero) lowercase select-none",
  {
    variants: {
      tone: {
        /** На світлому: ink, листок blue. */
        ink: "text-ink [--wordmark-accent:var(--blue)]",
        /** На ink: білий, листок lime. */
        "on-dark": "text-surface [--wordmark-accent:var(--lime)]",
        /** Великий вордмарк у футері (тільки на ink): lime, крапка blue. */
        lime: "text-lime [--wordmark-accent:var(--blue)]",
      },
      size: {
        sm: "text-(length:--size-h3)",
        md: "text-(length:--size-h2)",
        /** На всю ширину футера. */
        giant: "text-(length:--size-wordmark-giant)",
      },
    },
    defaultVariants: { tone: "ink", size: "sm" },
  },
);

export type WordmarkVariants = VariantProps<typeof wordmarkVariants>;
