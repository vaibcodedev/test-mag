import { Badge, type BadgeProps } from "~/components/ui/badge";
import { discountPercent } from "~/lib/format";

import type { ProductBadge, ProductCardData } from "./product-card.types";

const BADGE_VARIANT: Record<ProductBadge, NonNullable<BadgeProps["variant"]>> = {
  Новинка: "new",
  Хіт: "hit",
  Топ: "top",
};

type ProductCardBadgesProps = Pick<
  ProductCardData,
  "badge" | "price" | "compareAtPrice" | "used" | "availableForSale"
>;

/** Бейджі над фото: знижка, мітка з метаполя, стан уживаного пристрою. */
export function ProductCardBadges({
  badge,
  price,
  compareAtPrice,
  used,
  availableForSale,
}: ProductCardBadgesProps) {
  const percent = availableForSale ? discountPercent(price, compareAtPrice) : null;
  if (!percent && !badge && !used) return null;

  return (
    <ul className="absolute start-3 top-3 flex flex-col items-start gap-1.5">
      {percent ? (
        <li>
          <Badge variant="sale">
            <span className="sr-only">Знижка </span>−{percent}%
          </Badge>
        </li>
      ) : null}
      {badge ? (
        <li>
          <Badge variant={BADGE_VARIANT[badge]}>{badge}</Badge>
        </li>
      ) : null}
      {used ? (
        <li>
          <Badge variant="grade">
            <span className="sr-only">Стан: </span>
            {used.grade}
          </Badge>
        </li>
      ) : null}
    </ul>
  );
}
