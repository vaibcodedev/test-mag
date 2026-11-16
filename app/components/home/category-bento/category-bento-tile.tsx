import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

import type { ProductCardImage } from "~/components/product/product-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ItemMedia } from "~/components/ui/item";
import { ShopImage } from "~/components/ui/shop-image";
import { formatInteger, formatPrice, plural, type Money } from "~/lib/format";
import { cn } from "~/lib/utils";

export type BentoCategory = {
  title: string;
  to: string;
  image: ProductCardImage | null;
  productCount: number;
  /** Найнижча ціна в категорії; null — рядка «від N ₴» немає. */
  priceFrom: Money | null;
};

type CategoryBentoTileProps = {
  category: BentoCategory;
  /** Ink-плитка на дві колонки. */
  featured?: boolean;
  className?: string;
};

const IMAGE_FALLBACK_SIZE = 600;
const IMAGE_SIZES = "(min-width: 64rem) 20vw, 40vw";
const PRODUCT_FORMS = { one: "товар", few: "товари", many: "товарів" };

export function productCountLabel(count: number): string {
  return `${formatInteger(count)} ${plural(count, PRODUCT_FORMS)}`;
}

/** Плитка категорії на Card. Посилання в заголовку розтягнуте на всю плитку. */
export function CategoryBentoTile({
  category,
  featured = false,
  className,
}: CategoryBentoTileProps) {
  const { image } = category;

  const text = (
    <CardContent className="flex flex-1 flex-col justify-between gap-3">
      <CardHeader>
        <CardTitle asChild>
          <h3 className={featured ? "text-h3" : "wrap-anywhere xl:text-h3"}>
            <Link
              to={category.to}
              prefetch="intent"
              className={cn(
                "rounded-sm outline-none after:absolute after:inset-0 after:rounded-lg",
                featured
                  ? "focus-visible:after:shadow-focus-on-ink"
                  : "focus-visible:after:shadow-focus",
              )}
            >
              {category.title}
            </Link>
          </h3>
        </CardTitle>
        <CardDescription className="text-caption">
          {productCountLabel(category.productCount)}
        </CardDescription>
      </CardHeader>

      <CardFooter className="items-end justify-between gap-2">
        {category.priceFrom ? (
          <p className="flex min-w-0 flex-col">
            <span className={cn("text-caption", featured ? "text-on-ink-muted" : "text-ink-2")}>
              від
            </span>
            <span
              className={cn(
                featured ? "text-price text-lime" : "text-small font-semibold text-ink",
              )}
            >
              {formatPrice(category.priceFrom)}
            </span>
          </p>
        ) : (
          <span />
        )}
        <ItemMedia
          asChild
          variant="icon"
          tone={featured ? "dark" : "light"}
          className="size-10 rounded-pill transition-[background-color,color,transform] group-focus-within:-rotate-45 group-focus-within:bg-blue group-focus-within:text-surface group-hover:-rotate-45 group-hover:bg-blue group-hover:text-surface"
        >
          <span aria-hidden="true">
            <ArrowRight strokeWidth={2} />
          </span>
        </ItemMedia>
      </CardFooter>
    </CardContent>
  );

  const photo = image ? (
    <ShopImage
      src={image.url}
      alt={image.altText ?? ""}
      width={image.width ?? IMAGE_FALLBACK_SIZE}
      height={image.height ?? IMAGE_FALLBACK_SIZE}
      sizes={IMAGE_SIZES}
      className="absolute inset-0 size-full lift-photo object-cover"
    />
  ) : null;

  if (featured) {
    return (
      <Card
        asChild
        tone="ink"
        interactive
        padding="sm"
        className={cn("h-full min-h-56 flex-row gap-4 md:p-5", className)}
      >
        <article data-slot="category-tile" data-featured="true">
          {text}
          {/* Рамка 4:5 бере висоту плитки й рахує з неї ширину, AspectRatio рахує навпаки. */}
          <div className="relative aspect-4/5 shrink-0 self-stretch overflow-hidden rounded-md bg-photo">
            {photo}
          </div>
        </article>
      </Card>
    );
  }

  return (
    <Card
      asChild
      interactive
      padding="sm"
      className={cn("h-full min-h-56 md:flex-row md:gap-4 md:p-5", className)}
    >
      <article data-slot="category-tile">
        {/* Фото заповнює власну рамку: на мобільному зверху 4:3, з md — праворуч на всю висоту. */}
        <div className="relative aspect-4/3 shrink-0 overflow-hidden rounded-md bg-photo md:order-last md:aspect-auto md:w-1/3">
          {photo}
        </div>
        {text}
      </article>
    </Card>
  );
}
