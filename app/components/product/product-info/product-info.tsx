import type { ComponentProps, ReactNode } from "react";

import { InstallmentChip } from "~/components/product/installment-chip";
import type { ProductBadge } from "~/components/product/product-card";
import { StockStatus } from "~/components/product/stock-status";
import { UsedGrade, type ConditionGrade } from "~/components/product/used-grade";
import { Badge, type BadgeProps } from "~/components/ui/badge";
import { Card, CardDescription } from "~/components/ui/card";
import { Price } from "~/components/ui/price";
import { Rating } from "~/components/ui/rating";
import { discountPercent, type Money } from "~/lib/format";
import { cn } from "~/lib/utils";

/** Скільки коротких характеристик показуємо під назвою; решта — у блоці нижче на сторінці. */
const SPEC_CHIPS = 4;

const BADGE_VARIANT: Record<ProductBadge, NonNullable<BadgeProps["variant"]>> = {
  Новинка: "new",
  Хіт: "hit",
  Топ: "top",
};

export type ProductInfoProps = Omit<ComponentProps<"div">, "title"> & {
  /** Повна назва з пам'яттю та кольором: єдиний h1 сторінки. */
  title: string;
  price: Money;
  compareAt?: Money | null;
  available: boolean;
  /** Готовий підпис про доставку: «доставимо завтра». */
  delivery?: string | null;
  badge?: ProductBadge | null;
  /** Рейтинг показується лише зі справжніх відгуків. */
  rating?: { value: number; count: number } | null;
  /** custom.installment_months; без значення — 25. */
  installmentMonths?: number | null;
  /** custom.short_specs. */
  shortSpecs?: readonly string[];
  /** Лише для вживаних пристроїв. */
  used?: { grade: ConditionGrade; batteryHealth?: number | null } | null;
  /** Вибір варіанта: стоїть між ціною та наявністю. */
  children?: ReactNode;
};

/** Верх колонки купівлі: бейджі, назва, рейтинг, ціна, розстрочка, варіанти, наявність. */
export function ProductInfo({
  title,
  price,
  compareAt,
  available,
  delivery,
  badge,
  rating,
  installmentMonths,
  shortSpecs = [],
  used,
  children,
  className,
  ...props
}: ProductInfoProps) {
  const percent = available ? discountPercent(price, compareAt) : null;
  const specs = shortSpecs.slice(0, SPEC_CHIPS);

  return (
    <div data-slot="product-info" className={cn("flex flex-col gap-5", className)} {...props}>
      <div className="flex flex-col gap-3">
        {percent || badge || used ? (
          <ul role="list" className="flex flex-wrap gap-1.5">
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
        ) : null}

        <h1 className="text-h3 text-ink">{title}</h1>

        {rating ? <Rating value={rating.value} count={rating.count} /> : null}

        {specs.length > 0 ? (
          <ul role="list" aria-label="Головні характеристики" className="flex flex-wrap gap-1.5">
            {specs.map((spec) => (
              <li key={spec} className="min-w-0">
                <Badge variant="chip" className="max-w-full">
                  <span className="truncate">{spec}</span>
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {used ? (
        <Card tone="page" padding="sm">
          <CardDescription>
            Вживаний пристрій, стан «{used.grade}». Перевірили перед продажем: акумулятор, екран,
            камери та звук.
          </CardDescription>
          <UsedGrade batteryHealth={used.batteryHealth} tone="surface" />
        </Card>
      ) : null}

      <div className="flex flex-col items-start gap-2">
        <Price price={price} compareAt={available ? compareAt : null} size="lg" />
        {available ? <InstallmentChip price={price} months={installmentMonths} showIcon /> : null}
      </div>

      {children}

      <StockStatus available={available} delivery={delivery} className="text-small" />
    </div>
  );
}
