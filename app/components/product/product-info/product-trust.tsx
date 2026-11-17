import { CreditCard, RotateCcw, ShieldCheck, Truck, type LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Link } from "react-router";

import { USED_WARRANTY_MONTHS } from "~/components/product/used-grade";
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "~/components/ui/item";
import { cn } from "~/lib/utils";

const NEW_WARRANTY_MONTHS = 12;

type TrustItem = { icon: LucideIcon; title: string; to: string };

export type ProductTrustProps = Omit<ComponentProps<"ul">, "children"> & {
  /** Вживаний пристрій: гарантія 6 місяців замість 12. */
  used?: boolean;
};

/** Короткі гарантії магазину поруч із кнопкою «Купити». Кожен рядок веде на сторінку з умовами. */
export function ProductTrust({ used = false, className, ...props }: ProductTrustProps) {
  const warrantyMonths = used ? USED_WARRANTY_MONTHS : NEW_WARRANTY_MONTHS;
  const items: TrustItem[] = [
    { icon: Truck, title: "Доставка завтра", to: "/pages/delivery" },
    { icon: ShieldCheck, title: `Гарантія ${warrantyMonths} місяців`, to: "/pages/warranty" },
    { icon: RotateCcw, title: "14 днів на повернення", to: "/pages/returns" },
    { icon: CreditCard, title: "Оплата частинами", to: "/pages/installments" },
  ];

  return (
    <ItemGroup asChild className={cn("grid grid-cols-1 gap-1 sm:grid-cols-2", className)}>
      <ul role="list" data-slot="product-trust" {...props}>
        {items.map(({ icon: Icon, title, to }) => (
          <li key={to} className="min-w-0">
            <Item asChild size="sm">
              <Link viewTransition to={to} prefetch="intent">
                <ItemMedia variant="icon" aria-hidden="true">
                  <Icon strokeWidth={2} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{title}</ItemTitle>
                </ItemContent>
              </Link>
            </Item>
          </li>
        ))}
      </ul>
    </ItemGroup>
  );
}
