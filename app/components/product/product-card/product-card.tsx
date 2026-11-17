import { ShoppingCart } from "lucide-react";
import type { ComponentProps } from "react";
import { Link } from "react-router";

import { ColorSwatches } from "~/components/product/color-swatches";
import { CompareButton } from "~/components/product/compare-button";
import { InstallmentChip } from "~/components/product/installment-chip";
import { StockStatus } from "~/components/product/stock-status";
import { UsedGrade } from "~/components/product/used-grade";
import { WishlistButton } from "~/components/product/wishlist-button";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Button } from "~/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardTitle } from "~/components/ui/card";
import { Price } from "~/components/ui/price";
import { Rating } from "~/components/ui/rating";
import { ShopImage } from "~/components/ui/shop-image";
import { toggleCompare, useIsCompared } from "~/hooks/use-compare";
import { toggleWishlist, useIsWishlisted } from "~/hooks/use-wishlist";
import { cn } from "~/lib/utils";

import { ProductCardBadges } from "./product-card-badges";
import type { ProductCardData } from "./product-card.types";

const IMAGE_FALLBACK_SIZE = 600;
/** Кнопки поверх фото: видимий круг 36px, ціль натискання 44px через псевдоелемент. */
const PHOTO_BUTTON = "size-9 after:absolute after:-inset-1 [&_svg]:size-4";
const IMAGE_SIZES = "(min-width: 80rem) 20vw, (min-width: 48rem) 33vw, 50vw";

export type ProductCardProps = Omit<ComponentProps<"article">, "children"> & {
  product: ProductCardData;
  /** Картка на першому екрані: фото без lazy. */
  priority?: boolean;
  /** Рівень заголовка залежить від секції, де стоїть картка. */
  headingLevel?: "h2" | "h3" | "h4";
  onAddToCart?: () => void;
  /** Товар додається в кошик. */
  adding?: boolean;
  /**
   * Обране й порівняння. Без цих пропсів картка сама бере стан зі сторів у браузері
   * (~/hooks/use-wishlist, ~/hooks/use-compare) і показує сповіщення; передані пропси мають перевагу.
   */
  wishlisted?: boolean;
  onToggleWishlist?: () => void;
  compared?: boolean;
  onToggleCompare?: () => void;
};

export function ProductCard({
  product,
  priority = false,
  headingLevel: Heading = "h3",
  onAddToCart,
  adding = false,
  wishlisted,
  onToggleWishlist,
  compared,
  onToggleCompare,
  className,
  ...props
}: ProductCardProps) {
  const { image, availableForSale, compareCategory } = product;
  const href = `/products/${product.handle}`;

  const storedWishlisted = useIsWishlisted(product.handle);
  const storedCompared = useIsCompared(product.handle);
  // Картка керована ззовні, щойно передано стан або обробник.
  const wishlistControlled = wishlisted !== undefined || onToggleWishlist !== undefined;
  const compareControlled = compared !== undefined || onToggleCompare !== undefined;

  return (
    <Card asChild interactive padding="sm" className={cn("h-full", className)}>
      <article data-slot="product-card" data-available={availableForSale} {...props}>
        <div className="relative overflow-hidden rounded-md bg-photo">
          <AspectRatio ratio={1}>
            {image ? (
              <ShopImage
                src={image.url}
                alt={image.altText ?? ""}
                width={image.width ?? IMAGE_FALLBACK_SIZE}
                height={image.height ?? IMAGE_FALLBACK_SIZE}
                sizes={IMAGE_SIZES}
                priority={priority}
                className={cn(
                  "size-full lift-photo object-cover",
                  !availableForSale && "opacity-50",
                )}
              />
            ) : null}
          </AspectRatio>
          <ProductCardBadges {...product} />
        </div>

        {/* Кнопки стоять поверх посилання-картки, тому мають власний шар. */}
        <CardAction className="absolute end-6 top-6 z-10 flex flex-col gap-2">
          <WishlistButton
            productTitle={product.title}
            active={wishlistControlled ? (wishlisted ?? false) : storedWishlisted}
            onClick={wishlistControlled ? onToggleWishlist : () => toggleWishlist(product.handle)}
            className={PHOTO_BUTTON}
          />
          {/* Аксесуари не порівнюються: категорії немає — немає й кнопки. */}
          {compareCategory ? (
            <CompareButton
              productTitle={product.title}
              active={compareControlled ? (compared ?? false) : storedCompared}
              onClick={
                compareControlled
                  ? onToggleCompare
                  : () => toggleCompare(product.handle, compareCategory)
              }
              className={PHOTO_BUTTON}
            />
          ) : null}
        </CardAction>

        <CardContent className="flex flex-1 flex-col gap-2">
          <CardTitle asChild>
            <Heading>
              <Link
                to={href}
                prefetch="intent"
                className="line-clamp-2 min-h-10 rounded-sm outline-none after:absolute after:inset-0 after:rounded-lg focus-visible:after:shadow-focus"
              >
                {product.title}
              </Link>
            </Heading>
          </CardTitle>

          <div className="flex min-h-5 flex-wrap items-center justify-between gap-x-3 gap-y-1">
            {product.rating ? (
              <Rating value={product.rating.value} count={product.rating.count} variant="compact" />
            ) : null}
            {product.colors?.length ? <ColorSwatches colors={product.colors} /> : null}
          </div>

          {product.used ? <UsedGrade batteryHealth={product.used.batteryHealth} /> : null}

          <div className="mt-auto flex flex-col gap-2 pt-1">
            <Price
              price={product.price}
              compareAt={availableForSale ? product.compareAtPrice : null}
              from={product.priceFrom}
            />
            {availableForSale ? (
              <InstallmentChip price={product.price} months={product.installmentMonths} />
            ) : null}
            <StockStatus available={availableForSale} delivery={product.delivery} />
          </div>
        </CardContent>

        <CardFooter className="z-10">
          {availableForSale ? (
            <Button className="w-full" onClick={onAddToCart} loading={adding}>
              <ShoppingCart strokeWidth={2} aria-hidden="true" />
              Купити
              <span className="sr-only">: {product.title}</span>
            </Button>
          ) : (
            <Button asChild variant="secondary" className="w-full">
              <Link to={href} prefetch="intent" aria-label={`Докладніше: ${product.title}`}>
                Докладніше
              </Link>
            </Button>
          )}
        </CardFooter>
      </article>
    </Card>
  );
}
