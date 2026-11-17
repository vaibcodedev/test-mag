import type { ComponentProps } from "react";
import { NavLink } from "react-router";

import { Container } from "~/components/layout/container";
import type { ProductCardImage } from "~/components/product/product-card";
import { Button } from "~/components/ui/button";
import { ItemMedia } from "~/components/ui/item";
import { ShopImage } from "~/components/ui/shop-image";
import { cn } from "~/lib/utils";
import { TransitionSource } from "~/lib/view-transition";

export type CategoryPill = {
  title: string;
  to: string;
  image?: ProductCardImage | null;
};

export type CategoryPillsProps = Omit<ComponentProps<"nav">, "children"> & {
  categories: readonly CategoryPill[];
};

/** Власний розмір мініфото: круг 32px, для екранів 2× — 64px. */
const THUMB_SIZE = 64;
const THUMB_WIDTHS = [64, 96] as const;

/**
 * Ряд пігулок-категорій із мініфото: кожна — Button `surface` у формі пігулки.
 * На мобільному ряд прокручується горизонтально нативною прокруткою (зі snap і без смуги),
 * а з lg переноситься на кілька рядків — тому тут не ScrollArea.
 */
export function CategoryPills({ categories, className, ...props }: CategoryPillsProps) {
  if (categories.length === 0) return null;

  return (
    <nav aria-label="Категорії" data-slot="category-pills" className={className} {...props}>
      <Container>
        {/* py-1 лишає місце для кільця фокуса всередині області прокрутки. */}
        <ul className="-mx-gutter flex snap-x [scrollbar-width:none] gap-2 overflow-x-auto px-gutter py-1 lg:mx-0 lg:flex-wrap lg:px-0">
          {categories.map((category) => (
            <TransitionSource key={category.to} href={category.to}>
              <li className="shrink-0 snap-start">
                <Button
                  asChild
                  variant="surface"
                  size="sm"
                  className={cn("h-11 rounded-pill", category.image && "ps-1.5")}
                >
                  <NavLink viewTransition to={category.to} prefetch="intent">
                    {category.image ? (
                      <ItemMedia
                        asChild
                        variant="image"
                        fit="cover"
                        className="size-8 rounded-pill"
                      >
                        <span>
                          <ShopImage
                            src={category.image.url}
                            alt=""
                            width={THUMB_SIZE}
                            height={THUMB_SIZE}
                            sizes="32px"
                            widths={THUMB_WIDTHS}
                          />
                        </span>
                      </ItemMedia>
                    ) : null}
                    <span data-vt-target="text" className="inline-block">
                      {category.title}
                    </span>
                  </NavLink>
                </Button>
              </li>
            </TransitionSource>
          ))}
        </ul>
      </Container>
    </nav>
  );
}
