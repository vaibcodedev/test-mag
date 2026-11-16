import { ArrowRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { ShopPay } from "~/components/product/shop-pay";
import { Button } from "~/components/ui/button";
import { Card, CardDescription } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { formatPrice, isOnSale, type Money } from "~/lib/format";
import { cn } from "~/lib/utils";

export type CartSummaryProps = Omit<ComponentProps<"div">, "children"> & {
  /** Сума товарів із сервера (cart.cost.subtotalAmount). На клієнті суми не рахуємо. */
  subtotal: Money;
  /** До сплати (cart.cost.totalAmount). Окремий рядок з'являється, коли діє знижка на кошик. */
  total?: Money | null;
  /** Кошик змінюється: суми ще не підтверджені сервером. */
  pending?: boolean;
  checkoutUrl?: string | null;
  /**
   * Показати швидку оплату Shop Pay під кнопкою оформлення. Вмикайте, лише коли в кошику є
   * товари: кнопка оформлює поточний кошик. Поки кошик змінюється (pending), вона неактивна.
   */
  shopPay?: boolean;
  /** Друга дія під кнопкою оформлення: «Продовжити покупки». */
  secondaryAction?: ReactNode;
};

/** Підсумок кошика: сума, примітка про доставку, перехід до оформлення й Shop Pay. */
export function CartSummary({
  subtotal,
  total,
  pending = false,
  checkoutUrl,
  shopPay = false,
  secondaryAction,
  className,
  ...props
}: CartSummaryProps) {
  const discounted = total ? isOnSale(total, subtotal) : false;
  const amountClassName = cn("tabular-nums", pending && "opacity-50");

  return (
    <div data-slot="cart-summary" className={cn("flex flex-col gap-4", className)} {...props}>
      <Card tone="page" padding="sm">
        <dl className="flex flex-col gap-2" aria-busy={pending || undefined}>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-body text-ink-2">Сума</dt>
            <dd
              className={cn(
                discounted ? "text-body font-semibold text-ink-2" : "text-price text-ink",
                amountClassName,
              )}
            >
              {formatPrice(subtotal)}
            </dd>
          </div>
          {discounted && total ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-body text-ink-2">Зі знижкою</dt>
              <dd className={cn("text-price text-sale", amountClassName)}>{formatPrice(total)}</dd>
            </div>
          ) : null}
        </dl>
        <Separator />
        <CardDescription>Доставку розрахуємо під час оформлення замовлення.</CardDescription>
      </Card>
      <div className="flex flex-col gap-2">
        {checkoutUrl ? (
          <Button asChild size="lg" className="w-full">
            <a href={checkoutUrl}>
              Оформити замовлення
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </a>
          </Button>
        ) : null}
        {shopPay && checkoutUrl ? (
          <ShopPay disabled={pending} label="Оформити через Shop Pay" />
        ) : null}
        {secondaryAction}
      </div>
    </div>
  );
}
