import { ShoppingCart } from "lucide-react";
import type { ComponentProps } from "react";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";

export type CartEmptyProps = Omit<ComponentProps<"div">, "children"> & {
  /** Рівень заголовка: h2 на сторінці /cart, h3 у бічній панелі. */
  headingLevel?: "h2" | "h3";
  /** Клік по посиланню на каталог: панель кошика закривається. */
  onNavigate?: () => void;
};

/** Порожній кошик: що сталося і куди піти далі. */
export function CartEmpty({ headingLevel = "h2", onNavigate, ...props }: CartEmptyProps) {
  return (
    <Empty size="sm" {...props} data-slot="cart-empty">
      <EmptyHeader className="max-w-md">
        <EmptyMedia>
          <ShoppingCart strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle as={headingLevel}>У кошику поки порожньо</EmptyTitle>
        <EmptyDescription>
          Додайте iPhone, Mac чи аксесуар — він з&apos;явиться тут, і ви зможете оформити
          замовлення.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link viewTransition to="/collections" prefetch="intent" onClick={onNavigate}>
            Перейти до каталогу
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
