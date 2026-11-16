import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

import { publishCartViewed } from "~/components/analytics/analytics-trackers";
import { CartEmpty } from "~/components/cart/cart-empty";
import { CartErrorBanner } from "~/components/cart/cart-error-banner";
import { CartLines } from "~/components/cart/cart-line";
import { CartSummary, useCartTotals } from "~/components/cart/cart-summary";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import { useCart } from "~/lib/cart";
import { CART_DRAWER_ID, restoreCartDrawerFocus } from "~/lib/cart-drawer";
import { plural } from "~/lib/format";

const TITLE_ID = "cart-drawer-title";
const SKELETON_LINES = [0, 1];

function countLabel(count: number) {
  return `${count} ${plural(count, { one: "товар", few: "товари", many: "товарів" })}`;
}

export type CartDrawerPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Вміст бічної панелі кошика. Вантажиться окремим чанком під час першого відкриття. */
export function CartDrawerPanel({ open, onOpenChange }: CartDrawerPanelProps) {
  const cart = useCart((state) => state.data);
  const loading = useCart((state) => state.loading);
  const totals = useCartTotals();
  const location = useLocation();
  const hasLines = cart.lines.nodes.length > 0;

  // Перехід на іншу сторінку (товар із кошика, каталог) закриває панель.
  const openedAt = useRef(location.key);
  useEffect(() => {
    if (!open) {
      openedAt.current = location.key;
    } else if (openedAt.current !== location.key) {
      onOpenChange(false);
    }
  }, [open, location.key, onOpenChange]);

  // Подія перегляду кошика йде один раз на відкриття, а не на кожну зміну кількості.
  const cartRef = useRef(cart);
  cartRef.current = cart;
  useEffect(() => {
    if (open) publishCartViewed(cartRef.current);
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        id={CART_DRAWER_ID}
        side="right"
        data-testid="cart-drawer"
        onCloseAutoFocus={(event) => {
          // У панелі немає SheetTrigger, тому фокус на кнопку кошика повертаємо самі.
          event.preventDefault();
          restoreCartDrawerFocus();
        }}
      >
        <SheetHeader>
          <SheetTitle>
            {/* Сюди переходить фокус, коли з кошика прибрали останній товар. */}
            <span id={TITLE_ID} tabIndex={-1} className="outline-none">
              Кошик
            </span>
          </SheetTitle>
          <SheetDescription>
            {loading
              ? "Завантажуємо кошик"
              : hasLines
                ? countLabel(cart.totalQuantity)
                : "Товарів ще немає"}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="flex flex-col gap-4 py-4" aria-busy={loading || undefined}>
          <CartErrorBanner />
          {loading ? (
            <div className="flex flex-col gap-4 py-4">
              {SKELETON_LINES.map((line) => (
                <div key={line} className="flex gap-4">
                  <Skeleton className="size-20 rounded-md" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-11 w-32 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : hasLines ? (
            <CartLines emptyCartFocusId={TITLE_ID} headingLevel="h3" />
          ) : (
            <CartEmpty
              headingLevel="h3"
              className="px-0 py-4"
              onNavigate={() => onOpenChange(false)}
            />
          )}
        </SheetBody>

        {hasLines ? (
          <SheetFooter>
            <CartSummary
              subtotal={totals.subtotal}
              total={totals.total}
              pending={totals.pending}
              checkoutUrl={totals.checkoutUrl}
              shopPay={totals.hasLines}
              secondaryAction={
                <SheetClose asChild>
                  <Button variant="ghost" className="w-full">
                    Продовжити покупки
                  </Button>
                </SheetClose>
              }
            />
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
