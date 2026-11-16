import type { ComponentProps } from "react";

import { CategoryPills, type CategoryPill } from "~/components/home/category-pills";
import { HeroSlider, type HomeBanner } from "~/components/home/hero-slider";
import { PromoTiles, type PromoTilesProps } from "~/components/home/promo-tiles";
import { Container } from "~/components/layout/container";
import { cn } from "~/lib/utils";

export type HeroAreaProps = Omit<ComponentProps<"div">, "children" | "title"> & {
  /** Текст єдиного h1 сторінки. */
  title: string;
  /** Записи метаоб'єкта `home_banner` у порядку показу. */
  banners: readonly HomeBanner[];
  /** Три плитки поруч зі слайдером: новинка, знижка, Trade-in. */
  promo: Pick<PromoTilesProps, "newProduct" | "saleProduct" | "tradeIn">;
  /** Пігулки категорій над hero. */
  categories: readonly CategoryPill[];
};

/** Верх головної: пігулки категорій, h1 і сітка зі слайдером та промо-плитками. */
export function HeroArea({
  title,
  banners,
  promo,
  categories,
  className,
  ...props
}: HeroAreaProps) {
  return (
    <div data-slot="hero-area" className={cn("flex flex-col gap-4", className)} {...props}>
      <CategoryPills categories={categories} />
      <Container>
        <h1 className="text-card-title font-medium text-muted-foreground">{title}</h1>
      </Container>
      <Container className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <HeroSlider banners={banners} />
        <PromoTiles {...promo} />
      </Container>
    </div>
  );
}
