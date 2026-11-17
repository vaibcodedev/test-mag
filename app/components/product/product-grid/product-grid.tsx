import { memo, type ComponentProps } from "react";

import {
  ProductCard,
  ProductCardSkeleton,
  type ProductCardData,
  type ProductCardProps,
} from "~/components/product/product-card";
import { cn } from "~/lib/utils";

import {
  FIRST_ROW_COUNT,
  productGridVariants,
  type ProductGridColumns,
} from "./product-grid.variants";

const SKELETON_COUNT = 8;

export type ProductGridProps = Omit<ComponentProps<"ul">, "children"> & {
  products: readonly ProductCardData[];
  /** full — сітка на всю ширину (до 5 колонок); sidebar — поруч із фільтрами (до 4). */
  columns?: ProductGridColumns;
  /** Рівень заголовка в картках: залежить від заголовків сторінки навколо сітки. */
  headingLevel?: ProductCardProps["headingLevel"];
  /** Список оновлюється: старі товари лишаються на місці, але приглушені. */
  pending?: boolean;
  /** Скільки заглушок додати в кінець, поки вантажиться наступна сторінка. */
  loadingMore?: number;
  onAddToCart?: (product: ProductCardData) => void;
  /** handle товару, який зараз додається в кошик. */
  addingHandle?: string | null;
};

type GridItemProps = {
  product: ProductCardData;
  headingLevel?: ProductCardProps["headingLevel"];
  priority: boolean;
  onAddToCart?: (product: ProductCardData) => void;
  adding: boolean;
};

/**
 * Комірка сітки. memo: коли сітка лише дописує товари чи показує заглушки («Показати ще»),
 * уже намальовані картки не перемальовуються — інакше кнопка відповідала б із затримкою.
 */
const GridItem = memo(function GridItem({
  product,
  headingLevel,
  priority,
  onAddToCart,
  adding,
}: GridItemProps) {
  return (
    <li className="min-w-0">
      <ProductCard
        product={product}
        headingLevel={headingLevel}
        priority={priority}
        onAddToCart={onAddToCart ? () => onAddToCart(product) : undefined}
        adding={adding}
      />
    </li>
  );
});

/** Сітка карток товарів: каталог, пошук і будь-який інший список. */
export function ProductGrid({
  products,
  columns = "full",
  headingLevel,
  pending = false,
  loadingMore = 0,
  onAddToCart,
  addingHandle,
  className,
  ...props
}: ProductGridProps) {
  const priorityCount = FIRST_ROW_COUNT[columns];

  return (
    <ul
      role="list"
      data-slot="product-grid"
      aria-busy={pending || loadingMore > 0}
      className={cn(
        productGridVariants({ columns }),
        "transition-opacity duration-150",
        pending && "pointer-events-none opacity-60",
        className,
      )}
      {...props}
    >
      {products.map((product, index) => (
        <GridItem
          key={product.handle}
          product={product}
          headingLevel={headingLevel}
          priority={index < priorityCount}
          onAddToCart={onAddToCart}
          adding={addingHandle === product.handle}
        />
      ))}
      {Array.from({ length: loadingMore }, (_, index) => (
        <li key={`skeleton-${index}`} className="min-w-0">
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

export type ProductGridSkeletonProps = Omit<ComponentProps<"ul">, "children"> & {
  columns?: ProductGridColumns;
  count?: number;
};

/** Заглушка всієї сітки: поки відкривається інший список товарів. */
export function ProductGridSkeleton({
  columns = "full",
  count = SKELETON_COUNT,
  className,
  ...props
}: ProductGridSkeletonProps) {
  return (
    <ul
      role="list"
      data-slot="product-grid-skeleton"
      aria-busy="true"
      className={cn(productGridVariants({ columns }), className)}
      {...props}
    >
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="min-w-0">
          <ProductCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
