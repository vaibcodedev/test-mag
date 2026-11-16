/**
 * Спільний вигляд спливних шарів (меню, список Select, підказки пошуку) та їхніх рядків.
 * Тінь тут не декор: вона відділяє шар, що лежить поверх вмісту сторінки.
 */
export const popoverSurfaceClassName =
  "z-50 rounded-md border border-line bg-surface p-1.5 text-ink shadow-lift outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95";

/** Рядок меню: ціль натискання 44px, підсвітка page. */
export const menuItemClassName =
  "relative flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-3 text-small text-ink outline-none select-none data-highlighted:bg-page data-disabled:pointer-events-none data-disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5 [&_svg:not([class*='text-'])]:text-ink-2";

export const menuLabelClassName = "px-3 py-2 text-caption font-semibold text-muted-foreground";

export const menuSeparatorClassName = "-mx-1.5 my-1.5 h-px bg-line";
