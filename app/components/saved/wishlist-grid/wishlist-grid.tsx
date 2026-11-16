import type { ComponentProps } from "react";

import {
  ProductCard,
  ProductCardSkeleton,
  type ProductCardData,
} from "~/components/product/product-card";
import { cn } from "~/lib/utils";

export type WishlistGridProps = Omit<ComponentProps<"ul">, "children"> & {
  products: readonly ProductCardData[];
  /** Скільки товарів ще завантажується: стільки заглушок стане після карток. */
  pendingCount?: number;
  onAddToCart?: (product: ProductCardData) => void;
  /** handle товару, який зараз додається в кошик. */
  addingHandle?: string | null;
};

/** Сітка карток обраного: дві колонки на телефоні, до шести на широкому екрані. */
export function WishlistGrid({
  products,
  pendingCount = 0,
  onAddToCart,
  addingHandle,
  className,
  ...props
}: WishlistGridProps) {
  return (
    <ul
      role="list"
      data-slot="wishlist-grid"
      aria-busy={pendingCount > 0}
      className={cn(
        "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
        className,
      )}
      {...props}
    >
      {products.map((product) => (
        <li key={product.handle} className="min-w-0">
          <ProductCard
            product={product}
            headingLevel="h2"
            onAddToCart={onAddToCart ? () => onAddToCart(product) : undefined}
            adding={addingHandle === product.handle}
          />
        </li>
      ))}
      {Array.from({ length: pendingCount }, (_, index) => (
        <li key={`pending-${index}`} className="min-w-0">
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
