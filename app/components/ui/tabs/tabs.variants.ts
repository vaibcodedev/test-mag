import { cva, type VariantProps } from "class-variance-authority";

export const tabsListVariants = cva("group/tabs-list flex w-fit max-w-full items-center", {
  variants: {
    variant: {
      /** Пігулки: активна вкладка залита blue. */
      pills: "gap-2",
      /** Лінія: активна вкладка підкреслена blue. */
      line: "gap-6 border-b border-line",
    },
  },
  defaultVariants: {
    variant: "pills",
  },
});

export const tabsTriggerVariants = cva(
  "relative inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 text-small font-semibold whitespace-nowrap transition-colors duration-150 outline-none disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        pills:
          "rounded-pill bg-surface px-5 text-ink focus-ring-offset hover:bg-page-hover data-active:bg-blue data-active:text-surface data-active:hover:bg-blue-hover",
        line: "rounded-sm px-1 text-ink-2 focus-ring after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-transparent hover:text-ink data-active:text-blue data-active:after:bg-blue",
      },
    },
    defaultVariants: {
      variant: "pills",
    },
  },
);

export type TabsVariants = VariantProps<typeof tabsListVariants>;
