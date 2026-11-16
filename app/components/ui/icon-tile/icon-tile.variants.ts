import { cva, type VariantProps } from "class-variance-authority";

export const iconTileVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-md [&>svg]:shrink-0",
  {
    variants: {
      size: {
        /** 44 */
        md: "size-11 [&>svg]:size-5",
        /** 52 */
        lg: "size-13 [&>svg]:size-6",
      },
      tone: {
        light: "bg-page text-ink",
        dark: "bg-on-ink-10 text-surface",
      },
    },
    defaultVariants: {
      size: "md",
      tone: "light",
    },
  },
);

export type IconTileVariants = VariantProps<typeof iconTileVariants>;
