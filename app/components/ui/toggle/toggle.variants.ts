import { cva, type VariantProps } from "class-variance-authority";

/**
 * Кнопка з двома станами. Увімкнений стан завжди blue (на ink — lime для кільця кольору).
 * Кожен варіант має ціль натискання 44px.
 *
 * Стан «недоступно» (`data-available="false"` або проп `unavailable`): значення є, але його
 * немає в наявності чи такої комбінації не існує. Текст закреслений і приглушений, крапка
 * кольору й мініатюра — напівпрозорі. Це не disabled: елемент лишається натискним.
 */
export const toggleVariants = cva(
  "group/toggle relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 text-small font-semibold whitespace-nowrap transition-colors duration-150 outline-none select-none disabled:pointer-events-none disabled:opacity-45 data-[available=false]:text-muted-foreground data-[available=false]:line-through data-[available=false]:data-[state=on]:text-surface data-[available=false]:[&_[data-slot=toggle-swatch]]:opacity-30 data-[available=false]:[&_img]:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        /** Пігулка з текстом: пам'ять, колір, стан у виборі варіанта товару. */
        pill: "h-11 min-w-11 rounded-pill border px-4 data-[state=on]:border-blue data-[state=on]:bg-blue data-[state=on]:text-on-accent",
        /** Кругла кнопка-іконка 44px: «в обране», «до порівняння». */
        icon: "size-11 rounded-pill data-[state=on]:[&_svg]:fill-current",
        /** Крапка кольору 28px у цілі 44px; увімкнена — з кільцем. Колір задає проп swatch. */
        swatch: "size-11 rounded-pill",
        /** Мініатюра 80px: фото в галереї товару. Увімкнена — з межею. Усередині <img>. */
        thumbnail:
          "size-20 overflow-hidden rounded-md border-2 border-transparent bg-photo p-0 [&_img]:size-full [&_img]:object-cover",
      },
      onDark: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "pill",
        onDark: false,
        class: "border-line bg-surface text-ink focus-ring-offset hover:border-ink-2",
      },
      {
        variant: "pill",
        onDark: true,
        class: "border-transparent bg-on-ink-12 text-surface focus-ring-on-ink hover:bg-on-ink-20",
      },
      {
        variant: "icon",
        onDark: false,
        class: "bg-surface text-ink focus-ring hover:bg-page-hover data-[state=on]:text-blue",
      },
      {
        variant: "icon",
        onDark: true,
        class:
          "bg-on-ink-12 text-surface focus-ring-on-ink hover:bg-on-ink-20 data-[state=on]:text-lime",
      },
      { variant: "swatch", onDark: false, class: "focus-ring" },
      { variant: "swatch", onDark: true, class: "focus-ring-on-ink" },
      {
        variant: "thumbnail",
        onDark: false,
        class: "focus-ring-offset hover:border-line data-[state=on]:border-blue",
      },
      {
        variant: "thumbnail",
        onDark: true,
        class: "focus-ring-on-ink hover:border-on-ink-20 data-[state=on]:border-lime",
      },
    ],
    defaultVariants: {
      variant: "pill",
      onDark: false,
    },
  },
);

/** Крапка кольору всередині Toggle variant="swatch". Колір приходить через --swatch. */
export const toggleSwatchVariants = cva(
  "size-7 rounded-pill border bg-(--swatch) outline-2 outline-offset-2 outline-transparent transition-[outline-color] duration-150",
  {
    variants: {
      onDark: {
        true: "border-on-ink-20 group-data-[state=on]/toggle:outline-lime",
        false: "border-line group-data-[state=on]/toggle:outline-blue",
      },
    },
    defaultVariants: { onDark: false },
  },
);

export type ToggleVariants = VariantProps<typeof toggleVariants>;
