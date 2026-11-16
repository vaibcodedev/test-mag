import { Heart, House, LayoutGrid, Search, ShoppingCart, type LucideIcon } from "lucide-react";
import { NavLink } from "react-router";

import { preloadCartDrawer } from "~/components/cart/cart-drawer";
import { WishlistCount } from "~/components/saved/saved-count";
import { Badge } from "~/components/ui/badge";
import { useCart } from "~/lib/cart";
import { openCartDrawerFromLinkClick } from "~/lib/cart-drawer";
import { cn } from "~/lib/utils";

type Item = { title: string; to: string; icon: LucideIcon; end?: boolean };

const ITEMS: Item[] = [
  { title: "Головна", to: "/", icon: House, end: true },
  { title: "Каталог", to: "/collections", icon: LayoutGrid },
  { title: "Пошук", to: "/search", icon: Search },
  { title: "Обране", to: "/wishlist", icon: Heart },
];

const ITEM =
  "relative flex h-full flex-col items-center justify-center gap-1 rounded-sm text-caption font-semibold transition-colors duration-150 focus-ring";

/** Нижня панель на мобільному: Головна / Каталог / Пошук / Обране / Кошик. */
export function BottomBar() {
  const totalQuantity = useCart((state) => state.data.totalQuantity);

  return (
    <nav
      aria-label="Швидка навігація"
      data-slot="bottom-bar"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {ITEMS.map(({ title, to, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) => cn(ITEM, isActive ? "text-blue" : "text-ink-2")}
            >
              <span className="relative">
                <Icon aria-hidden="true" strokeWidth={2} className="size-6" />
                {to === "/wishlist" ? <WishlistCount className="-end-2.5 -top-1.5" /> : null}
              </span>
              {title}
            </NavLink>
          </li>
        ))}
        <li>
          <NavLink
            to="/cart"
            aria-haspopup="dialog"
            onClick={openCartDrawerFromLinkClick}
            onPointerEnter={preloadCartDrawer}
            onFocus={preloadCartDrawer}
            className={({ isActive }) => cn(ITEM, isActive ? "text-blue" : "text-ink-2")}
          >
            <span className="relative">
              <ShoppingCart aria-hidden="true" strokeWidth={2} className="size-6" />
              {totalQuantity > 0 ? (
                <Badge variant="count" className="absolute -end-2.5 -top-1.5">
                  <span className="sr-only">Товарів у кошику: </span>
                  {totalQuantity}
                </Badge>
              ) : null}
            </span>
            Кошик
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
