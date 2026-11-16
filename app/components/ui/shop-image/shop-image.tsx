import type { ComponentProps } from "react";

import { shopifyImageUrl, shopifySrcSet } from "~/lib/shopify/image";
import { cn } from "~/lib/utils";

const DEFAULT_WIDTHS = [240, 360, 480, 720, 960, 1440] as const;

export type ShopImageProps = Omit<
  ComponentProps<"img">,
  "src" | "srcSet" | "loading" | "width" | "height"
> & {
  src: string;
  /** Порожній рядок, якщо зображення декоративне. */
  alt: string;
  /** Власні розміри зображення: браузер резервує місце й не зсуває верстку (CLS). */
  width: number;
  height: number;
  /** Скільки місця зображення займає на екрані, напр. "(min-width: 64rem) 25vw, 50vw". */
  sizes: string;
  /** Ширини для srcset. */
  widths?: readonly number[];
  /** Зображення першого екрана: без lazy і з fetchpriority="high". */
  priority?: boolean;
};

/** <img> з srcset із Shopify CDN. Сторонні адреси віддає як є. */
export function ShopImage({
  src,
  alt,
  width,
  height,
  sizes,
  widths = DEFAULT_WIDTHS,
  priority = false,
  className,
  ...props
}: ShopImageProps) {
  const fallbackWidth = widths[Math.floor(widths.length / 2)] ?? width;

  return (
    <img
      data-slot="shop-image"
      src={shopifyImageUrl(src, { width: fallbackWidth })}
      srcSet={shopifySrcSet(src, widths)}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={cn("block max-w-full", className)}
      {...props}
    />
  );
}
