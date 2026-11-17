import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router";

import { publishCartViewed } from "~/components/analytics/analytics-trackers";
import { CartEmpty } from "~/components/cart/cart-empty";
import { CartErrorBanner } from "~/components/cart/cart-error-banner";
import { CartLines } from "~/components/cart/cart-line";
import { CartSummary, useCartTotals } from "~/components/cart/cart-summary";
import { Container } from "~/components/layout/container";
import { Button } from "~/components/ui/button";
import { Card, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { useCart } from "~/lib/cart";
import { plural } from "~/lib/format";

const TITLE_ID = "cart-page-title";

/**
 * Сторінка /cart. Кошик приходить із кореневого loader через CartProvider, тому рядки й суми
 * є в HTML і без JavaScript. Рядки та підсумок — ті самі компоненти, що й у бічній панелі.
 */
export function CartPage() {
  const cart = useCart((state) => state.data);
  const loading = useCart((state) => state.loading);
  const totals = useCartTotals();
  const hasLines = cart.lines.nodes.length > 0;
  const count = cart.totalQuantity;

  useEffect(() => {
    publishCartViewed(cart);
  }, [cart]);

  return (
    <Container data-slot="cart-page" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 id={TITLE_ID} tabIndex={-1} className="text-h2 text-ink outline-none">
          Кошик
        </h1>
        {hasLines ? (
          <p className="text-body text-muted-foreground">
            {count} {plural(count, { one: "товар", few: "товари", many: "товарів" })}
          </p>
        ) : null}
      </div>

      <CartErrorBanner />

      {loading ? (
        <Card aria-busy="true">
          <p className="sr-only" role="status">
            Завантажуємо кошик
          </p>
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
        </Card>
      ) : hasLines ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <Card asChild padding="none" className="px-4 md:px-6">
            <section aria-labelledby="cart-lines-title">
              <h2 id="cart-lines-title" className="sr-only">
                Товари в кошику
              </h2>
              <CartLines emptyCartFocusId={TITLE_ID} headingLevel="h3" />
            </section>
          </Card>
          <Card asChild className="lg:sticky lg:top-24">
            <aside aria-labelledby="cart-summary-title">
              <CardTitle asChild size="h3">
                <h2 id="cart-summary-title">Разом</h2>
              </CardTitle>
              <CartSummary
                subtotal={totals.subtotal}
                total={totals.total}
                pending={totals.pending}
                checkoutUrl={totals.checkoutUrl}
                shopPay={totals.hasLines}
                secondaryAction={
                  <Button asChild variant="ghost" className="w-full">
                    <Link viewTransition to="/collections" prefetch="intent">
                      <ArrowLeft aria-hidden="true" strokeWidth={2} />
                      Продовжити покупки
                    </Link>
                  </Button>
                }
              />
            </aside>
          </Card>
        </div>
      ) : (
        <CartEmpty headingLevel="h2" className="p-8 md:p-12" />
      )}
    </Container>
  );
}
