import type { ComponentProps } from "react";

import { ItemMedia } from "~/components/ui/item";

import type { IconTileVariants } from "./icon-tile.variants";

export type IconTileProps = ComponentProps<"span"> & IconTileVariants;

/**
 * Квадрат 44 або 52 під іконкою lucide. Іконка декоративна: підпис стоїть поруч.
 * Тонкий псевдонім `ItemMedia variant="icon"`; лишається <span>, щоб жити всередині
 * посилань, кнопок і абзаців.
 */
export function IconTile({ className, size = "md", tone = "light", ...props }: IconTileProps) {
  return (
    <ItemMedia asChild variant="icon" size={size} tone={tone} className={className}>
      <span data-slot="icon-tile" aria-hidden="true" {...props} />
    </ItemMedia>
  );
}
