import { cva, type VariantProps } from "class-variance-authority";

export const sheetContentVariants = cva(
  "fixed z-50 flex flex-col bg-surface text-ink outline-none data-open:animate-in data-open:duration-300 data-closed:animate-out data-closed:duration-200",
  {
    variants: {
      side: {
        /** Кошик, фільтри. */
        right:
          "inset-y-0 right-0 h-full w-full sm:max-w-md data-open:slide-in-from-right data-closed:slide-out-to-right",
        /** Мобільне меню. */
        left: "inset-y-0 left-0 h-full w-full sm:max-w-md data-open:slide-in-from-left data-closed:slide-out-to-left",
        top: "inset-x-0 top-0 max-h-dvh rounded-b-xl data-open:slide-in-from-top data-closed:slide-out-to-top",
        bottom:
          "inset-x-0 bottom-0 max-h-dvh rounded-t-xl data-open:slide-in-from-bottom data-closed:slide-out-to-bottom",
      },
    },
    defaultVariants: { side: "right" },
  },
);

export type SheetContentVariants = VariantProps<typeof sheetContentVariants>;
