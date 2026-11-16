import type { ComponentProps } from "react";

import { Badge } from "~/components/ui/badge";
import { useCompare } from "~/hooks/use-compare";
import { useWishlist } from "~/hooks/use-wishlist";
import { cn } from "~/lib/utils";

export type SavedCountProps = Omit<ComponentProps<"span">, "children"> & {
  count: number;
  /** Підпис для зчитувача екрана перед числом: «Товарів в обраному». */
  label: string;
};

/**
 * Лічильник у кутку іконки. Батьківський елемент має бути `relative`.
 * Для порожнього списку нічого не рендерить.
 */
export function SavedCount({ count, label, className, ...props }: SavedCountProps) {
  if (count <= 0) return null;

  return (
    <Badge
      variant="count"
      data-slot="saved-count"
      className={cn("pointer-events-none absolute end-0 top-0", className)}
      {...props}
    >
      <span className="sr-only">{label}: </span>
      {count}
    </Badge>
  );
}

export type SavedListCountProps = Omit<SavedCountProps, "count" | "label">;

/** Скільки товарів в обраному. На сервері й для порожнього списку нічого не рендерить. */
export function WishlistCount(props: SavedListCountProps) {
  const { count } = useWishlist();
  return <SavedCount count={count} label="Товарів в обраному" {...props} />;
}

/** Скільки товарів у порівнянні. На сервері й для порожнього списку нічого не рендерить. */
export function CompareCount(props: SavedListCountProps) {
  const { count } = useCompare();
  return <SavedCount count={count} label="Товарів у порівнянні" {...props} />;
}
