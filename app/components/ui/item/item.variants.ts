import { cva, type VariantProps } from "class-variance-authority";

/** Рядок «медіа + заголовок + опис». Посиланням або кнопкою стає через asChild. */
export const itemVariants = cva(
  "group/item flex w-full min-w-0 flex-wrap items-center rounded-md border border-transparent text-small transition-colors duration-150 outline-none [a]:cursor-pointer [button]:cursor-pointer [button]:text-start",
  {
    variants: {
      variant: {
        /** Без тла: рядок усередині картки чи списку. */
        default: "text-ink focus-ring [a]:hover:bg-page [button]:hover:bg-page",
        /** З межею: окремий рядок на білому. */
        outline:
          "border-line bg-surface text-ink focus-ring [a]:hover:border-ink-2 [button]:hover:border-ink-2",
        /** На page-тлі всередині білої картки. */
        muted: "bg-page text-ink focus-ring [a]:hover:bg-page-hover [button]:hover:bg-page-hover",
        /** На ink. */
        "on-dark":
          "text-surface focus-ring-on-ink [a]:hover:bg-on-ink-10 [button]:hover:bg-on-ink-10",
      },
      size: {
        md: "gap-4 p-4",
        sm: "min-h-11 gap-3 px-3 py-2",
        /** Без полів: рядок переваг, контактів, доставки у власній сітці. */
        none: "gap-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

/**
 * Медіа рядка. `icon` — плитка під іконкою lucide (той самий вигляд, що в IconTile):
 * md 44, lg 52, тон light на світлому і dark на ink. `image` — мініатюра фото на bg-photo.
 */
export const itemMediaVariants = cva(
  "shrink-0 items-center justify-center group-has-data-[slot=item-description]/item:self-start [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "flex gap-2 [&_svg:not([class*='size-'])]:size-5",
        icon: "inline-flex rounded-md [&>svg]:shrink-0",
        image:
          "flex overflow-hidden rounded-md bg-photo [&_img]:size-full [&_img]:object-contain [&_img]:mix-blend-multiply",
      },
      size: {
        md: "",
        lg: "",
      },
      tone: {
        light: "",
        dark: "",
      },
    },
    compoundVariants: [
      { variant: "icon", size: "md", class: "size-11 [&>svg]:size-5" },
      { variant: "icon", size: "lg", class: "size-13 [&>svg]:size-6" },
      { variant: "icon", tone: "light", class: "bg-page text-ink" },
      { variant: "icon", tone: "dark", class: "bg-on-ink-10 text-surface" },
      { variant: "image", size: "md", class: "size-14" },
      { variant: "image", size: "lg", class: "size-18" },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
      tone: "light",
    },
  },
);

export type ItemVariants = VariantProps<typeof itemVariants>;
export type ItemMediaVariants = VariantProps<typeof itemMediaVariants>;
