import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-[background-color,color,transform] duration-150 ease-soft select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-45 aria-busy:pointer-events-none aria-disabled:pointer-events-none aria-disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        /** Усі дії на світлому тлі. */
        primary:
          "bg-blue text-on-accent focus-ring-offset hover:bg-blue-hover active:bg-blue-active",
        /** Тільки на ink. */
        lime: "bg-lime text-on-accent focus-ring-on-ink hover:bg-lime-hover active:bg-lime-active",
        ink: "bg-ink text-surface focus-ring-offset hover:bg-ink-hover active:bg-ink",
        secondary: "bg-page text-ink focus-ring hover:bg-page-hover active:bg-page-active",
        /** Друга дія на сірому тлі сторінки: біла кнопка. */
        surface: "bg-surface text-ink focus-ring hover:bg-page-hover active:bg-page-active",
        ghost: "bg-transparent text-ink focus-ring hover:bg-page active:bg-page-hover",
        /** Друга дія на ink: білий 12%. */
        "on-dark":
          "bg-on-ink-12 text-surface focus-ring-on-ink hover:bg-on-ink-20 active:bg-on-ink-10",
        link: "rounded-sm text-blue underline-offset-4 focus-ring hover:underline active:translate-y-0",
      },
      size: {
        /** 40px на вигляд; псевдоелемент розширює ціль натискання до 44px. */
        sm: "h-10 px-4 text-small font-semibold after:absolute after:inset-x-0 after:-inset-y-0.5",
        md: "h-11.5 px-5 text-body font-semibold",
        lg: "h-14 px-7 text-body font-semibold",
        icon: "size-11",
      },
    },
    compoundVariants: [{ variant: "link", size: ["sm", "md", "lg"], class: "h-auto px-0" }],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
