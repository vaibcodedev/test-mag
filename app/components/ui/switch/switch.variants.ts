import { cva, type VariantProps } from "class-variance-authority";

/** Доріжка перемикача. Псевдоелемент розширює ціль натискання до 44px. */
export const switchVariants = cva(
  "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-pill bg-line focus-ring-offset transition-colors duration-150 outline-none after:absolute hover:bg-page-active disabled:cursor-not-allowed disabled:opacity-45 data-checked:bg-blue data-checked:hover:bg-blue-hover",
  {
    variants: {
      size: {
        /** 44×24 */
        md: "h-6 w-11 after:inset-x-0 after:-inset-y-2.5",
        /** 36×20 */
        sm: "h-5 w-9 after:-inset-x-1 after:-inset-y-3",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export const switchThumbVariants = cva(
  "pointer-events-none block translate-x-0.5 rounded-pill bg-surface transition-transform duration-150",
  {
    variants: {
      size: {
        md: "size-5 data-checked:translate-x-5.5",
        sm: "size-4 data-checked:translate-x-4.5",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type SwitchVariants = VariantProps<typeof switchVariants>;
