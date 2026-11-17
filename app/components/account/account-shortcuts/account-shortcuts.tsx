import { ChevronRight, Heart, Scale, ShoppingCart, type LucideIcon } from "lucide-react";
import { useId, type ComponentProps } from "react";
import { Link } from "react-router";

import { Badge } from "~/components/ui/badge";
import { Card, CardTitle } from "~/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";
import { useCompare } from "~/hooks/use-compare";
import { useWishlist } from "~/hooks/use-wishlist";
import { useOptionalCart } from "~/lib/cart";
import { plural } from "~/lib/format";

export type AccountShortcutsViewProps = Omit<ComponentProps<"section">, "children"> & {
  wishlistCount: number;
  compareCount: number;
  cartCount: number;
};

type Shortcut = {
  to: string;
  title: string;
  icon: LucideIcon;
  count: number;
};

const ITEM_FORMS = { one: "товар", few: "товари", many: "товарів" };

/** «Обране: 3 товари» — назва посилання для зчитувача екрана, коли список не порожній. */
function shortcutLabel(title: string, count: number): string | undefined {
  return count > 0 ? `${title}: ${count} ${plural(count, ITEM_FORMS)}` : undefined;
}

/** Швидкі переходи з лічильниками. Числа приходять пропами — зручно для історій і тестів. */
export function AccountShortcutsView({
  wishlistCount,
  compareCount,
  cartCount,
  className,
  ...props
}: AccountShortcutsViewProps) {
  const titleId = useId();
  const shortcuts: Shortcut[] = [
    {
      to: "/wishlist",
      title: "Обране",
      icon: Heart,
      count: wishlistCount,
    },
    {
      to: "/compare",
      title: "Порівняння",
      icon: Scale,
      count: compareCount,
    },
    {
      to: "/cart",
      title: "Кошик",
      icon: ShoppingCart,
      count: cartCount,
    },
  ];

  return (
    <Card asChild className={className}>
      <section aria-labelledby={titleId} data-slot="account-shortcuts" {...props}>
        <CardTitle asChild size="h3">
          <h2 id={titleId}>Швидкий доступ</h2>
        </CardTitle>

        {/* Рядки-посилання мають поля під hover, тож список зсунуто на ці поля вліво. */}
        <ItemGroup asChild className="-mx-3 w-auto gap-1">
          <ul role="list">
            {shortcuts.map(({ to, title, icon: Icon, count }) => (
              <li key={to}>
                <Item asChild size="sm">
                  <Link
                    viewTransition
                    to={to}
                    prefetch="intent"
                    aria-label={shortcutLabel(title, count)}
                  >
                    <ItemMedia variant="icon">
                      <Icon aria-hidden="true" strokeWidth={2} />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{title}</ItemTitle>
                    </ItemContent>
                    <ItemActions>
                      {count > 0 ? <Badge variant="count">{count}</Badge> : null}
                      <ChevronRight
                        aria-hidden="true"
                        strokeWidth={2}
                        className="size-5 text-muted-foreground"
                      />
                    </ItemActions>
                  </Link>
                </Item>
              </li>
            ))}
          </ul>
        </ItemGroup>
      </section>
    </Card>
  );
}

export type AccountShortcutsProps = Omit<
  AccountShortcutsViewProps,
  "wishlistCount" | "compareCount" | "cartCount"
>;

/**
 * Обране, порівняння й кошик із живими лічильниками. Списки зберігаються в браузері,
 * тому на сервері лічильників немає — вони з'являються після монтування.
 */
export function AccountShortcuts(props: AccountShortcutsProps) {
  const { count: wishlistCount } = useWishlist();
  const { count: compareCount } = useCompare();
  // Поза CartProvider (тести, сторібук) кошика немає.
  const cartCount = useOptionalCart((state) => state.data.totalQuantity) ?? 0;

  return (
    <AccountShortcutsView
      wishlistCount={wishlistCount}
      compareCount={compareCount}
      cartCount={cartCount}
      {...props}
    />
  );
}
