import { Heart, Scale, Search, ShoppingCart, User } from "lucide-react";
import { Link } from "react-router";

import { preloadCartDrawer } from "~/components/cart/cart-drawer";
import { Container } from "~/components/layout/container";
import { MegaMenu, type MegaMenuCategory } from "~/components/layout/mega-menu";
import { MobileNav } from "~/components/layout/mobile-nav";
import { SearchBar } from "~/components/layout/search-bar";
import { CompareCount, WishlistCount } from "~/components/saved/saved-count";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Wordmark } from "~/components/ui/wordmark";
import { useCart } from "~/lib/cart";
import { openCartDrawerFromLinkClick } from "~/lib/cart-drawer";
import { plural } from "~/lib/format";

const CART_COUNT_MAX = 99;

function cartLabel(count: number) {
  if (count === 0) return "Кошик порожній";
  return `Кошик: ${count} ${plural(count, { one: "товар", few: "товари", many: "товарів" })}`;
}

/** Липка біла шапка: логотип, каталог, пошук, порівняння, обране, кабінет, кошик. */
export function Header({ categories }: { categories: readonly MegaMenuCategory[] }) {
  const totalQuantity = useCart((state) => state.data.totalQuantity);

  return (
    <header data-slot="header" className="sticky top-0 z-40 border-b border-line bg-surface">
      <Container className="flex h-header items-center gap-3 lg:gap-6">
        <div className="lg:hidden">
          <MobileNav categories={categories} />
        </div>

        <Link
          viewTransition
          to="/"
          aria-label="Ionov Store — на головну"
          className="inline-flex min-h-11 shrink-0 items-center rounded-sm focus-ring"
        >
          <Wordmark size="sm" aria-hidden="true" />
        </Link>

        <div className="hidden lg:block">
          <MegaMenu categories={categories} />
        </div>

        <SearchBar className="hidden min-w-0 flex-1 md:block" />

        <nav
          aria-label="Кабінет і кошик"
          className="ms-auto flex shrink-0 items-center gap-1 md:ms-0"
        >
          {/* Кнопка вже inline-flex, тому ховаємо її класами md:hidden і max-lg:hidden, а не парою hidden + lg:inline-flex. */}
          <Button asChild variant="ghost" size="icon" className="md:hidden">
            <Link viewTransition to="/search" aria-label="Пошук">
              <Search aria-hidden="true" strokeWidth={2} className="size-6" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="max-lg:hidden">
            <Link viewTransition to="/compare">
              <span className="sr-only">Порівняння</span>
              <Scale aria-hidden="true" strokeWidth={2} className="size-6" />
              <CompareCount />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="max-lg:hidden">
            <Link viewTransition to="/wishlist">
              <span className="sr-only">Обране</span>
              <Heart aria-hidden="true" strokeWidth={2} className="size-6" />
              <WishlistCount />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="max-sm:hidden">
            <Link viewTransition to="/account" aria-label="Кабінет">
              <User aria-hidden="true" strokeWidth={2} className="size-6" />
            </Link>
          </Button>
          <Button asChild variant="primary" className="ms-1 px-4 text-small">
            <Link
              viewTransition
              to="/cart"
              aria-label={cartLabel(totalQuantity)}
              aria-haspopup="dialog"
              data-testid="cart-trigger"
              onClick={openCartDrawerFromLinkClick}
              onPointerEnter={preloadCartDrawer}
              onFocus={preloadCartDrawer}
            >
              <ShoppingCart aria-hidden="true" strokeWidth={2} />
              <span className="hidden xl:inline">Кошик</span>
              {totalQuantity > 0 ? (
                <Badge variant="count-on-blue" aria-hidden="true">
                  {totalQuantity > CART_COUNT_MAX ? `${CART_COUNT_MAX}+` : totalQuantity}
                </Badge>
              ) : null}
            </Link>
          </Button>
          <span aria-live="polite" aria-atomic="true" className="sr-only">
            {cartLabel(totalQuantity)}
          </span>
        </nav>
      </Container>
    </header>
  );
}
