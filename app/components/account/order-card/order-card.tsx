import { ArrowRight, ExternalLink, Package } from "lucide-react";
import { useId, type ComponentProps } from "react";
import { Link } from "react-router";

import { ReorderButton } from "~/components/account/reorder-button";
import { PublishedDate } from "~/components/content/published-date";
import { Button } from "~/components/ui/button";
import { Card, CardTitle } from "~/components/ui/card";
import { ItemMedia } from "~/components/ui/item";
import { Price } from "~/components/ui/price";
import { ShopImage } from "~/components/ui/shop-image";
import { orderPath } from "~/lib/account/order-id";
import { cn } from "~/lib/utils";

import type { AccountOrder, OrderLineItem } from "./order-card.types";
import { itemCountLabel, orderItemsPreview, orderItemsSummary } from "./order-items";
import { OrderProgress } from "./order-progress";
import { orderHeadline, orderProgress, paymentStatus } from "./order-status";

export type OrderCardProps = Omit<ComponentProps<"article">, "children"> & {
  order: AccountOrder;
};

const THUMB_SIZE = 56;
const THUMB_CLASS = "size-14 rounded-md";
const THUMB_WIDTHS = [56, 112, 168] as const;

function Thumb({ item, className }: { item: OrderLineItem; className?: string }) {
  return (
    <ItemMedia
      variant="image"
      fit="cover"
      className={cn(THUMB_CLASS, "text-muted-foreground", className)}
    >
      {item.image ? (
        <ShopImage
          src={item.image.url}
          alt=""
          width={item.image.width ?? THUMB_SIZE}
          height={item.image.height ?? THUMB_SIZE}
          sizes={`${THUMB_SIZE}px`}
          widths={THUMB_WIDTHS}
        />
      ) : (
        <Package strokeWidth={2} className="size-5" />
      )}
    </ItemMedia>
  );
}

/** Колір крапки біля стану: він лише підсилює текст поруч. */
const DOT_CLASS = {
  positive: "bg-success",
  neutral: "bg-blue",
  attention: "bg-danger",
} as const;

/**
 * Картка замовлення. Перший рядок — стан («що з замовленням?») і сума; далі номер із датою,
 * що всередині, смуга етапів і дії: сторінка замовлення в кабінеті, «Повторити» та сторінка
 * стану в Shopify (відстеження, повернення).
 */
export function OrderCard({ order, className, ...props }: OrderCardProps) {
  const titleId = useId();
  const detailsPath = orderPath(order.id);
  const preview = orderItemsPreview(order);
  const summary = orderItemsSummary(preview);
  const headline = orderHeadline(order);
  const hasProgress = orderProgress(order) !== null;
  const payment = paymentStatus(order.financialStatus);

  return (
    <Card asChild className={cn("gap-4 p-4 sm:gap-5 sm:p-6", className)}>
      <article aria-labelledby={titleId} data-slot="order-card" {...props}>
        <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
          <div className="flex min-w-0 flex-col gap-1">
            <p
              data-slot="order-headline"
              className="flex items-baseline gap-2 text-card-title text-ink"
            >
              <span
                aria-hidden="true"
                data-tone={headline.tone}
                className={cn(
                  "size-2 shrink-0 -translate-y-0.5 rounded-pill",
                  headline.cancelled ? "bg-ink-2" : DOT_CLASS[headline.tone],
                )}
              />
              <span className="min-w-0 wrap-anywhere">
                <span className="sr-only">Стан: </span>
                {headline.label}
              </span>
            </p>
            <div className="text-small wrap-anywhere text-ink-2">
              <CardTitle asChild className="inline text-small font-semibold text-ink">
                <h3 id={titleId}>Замовлення {order.name}</h3>
              </CardTitle>
              <span aria-hidden="true"> · </span>
              <span className="sr-only">, </span>
              <PublishedDate value={order.processedAt} />
            </div>
          </div>
          <div className="flex max-w-full min-w-0 flex-col sm:ms-auto sm:items-end">
            <Price price={order.totalPrice} className="wrap-anywhere" />
            {/* Оплата поруч із сумою — коли смуги етапів немає (скасоване замовлення). */}
            {payment && !hasProgress ? (
              <span data-slot="order-payment" className="text-caption text-ink-2">
                <span className="sr-only">Оплата: </span>
                {payment.label}
              </span>
            ) : null}
          </div>
        </header>

        {preview.thumbs.length > 0 || summary ? (
          <div className="flex items-center gap-3 sm:gap-4">
            {preview.thumbs.length > 0 ? (
              // Мініатюри декоративні: склад замовлення названо текстом поруч.
              <div aria-hidden="true" data-slot="order-thumbs" className="flex shrink-0 gap-2">
                {preview.thumbs.map((item, index) => (
                  <Thumb
                    key={item.id}
                    item={item}
                    // На телефоні поруч із текстом лишається одне фото.
                    className={index > 0 ? "max-sm:hidden" : undefined}
                  />
                ))}
                {preview.hiddenCount > 0 ? (
                  <ItemMedia
                    variant="image"
                    data-thumb="more"
                    className={cn(
                      THUMB_CLASS,
                      "bg-page text-small font-semibold text-ink tabular-nums max-sm:hidden",
                    )}
                  >
                    +{preview.hiddenCount}
                  </ItemMedia>
                ) : null}
              </div>
            ) : null}
            <div className="flex min-w-0 flex-col gap-0.5">
              {summary ? (
                <p className="line-clamp-2 text-body wrap-anywhere text-ink">{summary}</p>
              ) : null}
              {preview.totalQuantity > 0 ? (
                <p className="text-small text-ink-2">{itemCountLabel(preview.totalQuantity)}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Смуга етапів: пройдене зафарбовано, поточний етап заповнено наполовину. */}
        <OrderProgress order={order} />

        <footer data-slot="order-actions" className="flex flex-wrap items-center gap-2">
          {/* Сторінка стану живе в Shopify, тому це звичайний <a>. */}
          <Button asChild variant="link" size="sm" className="me-auto min-h-11 px-0">
            <a href={order.statusPageUrl} aria-label={`Стан замовлення ${order.name}`}>
              Стан замовлення
              <ExternalLink aria-hidden="true" strokeWidth={2} className="size-4" />
            </a>
          </Button>
          {detailsPath ? (
            // На телефоні кнопки ділять рядок порівну.
            <div className="flex flex-wrap gap-2 max-sm:w-full max-sm:*:grow">
              {/* Повторити можна лише замовлення з позиціями: порожнє нічого не додасть. */}
              {preview.lineCount > 0 ? (
                <ReorderButton
                  orderId={order.id}
                  orderName={order.name}
                  variant="secondary"
                  size="sm"
                  compact
                />
              ) : null}
              <Button asChild size="sm">
                <Link
                  viewTransition
                  to={detailsPath}
                  aria-label={`Деталі замовлення ${order.name}`}
                >
                  Деталі
                  <ArrowRight aria-hidden="true" strokeWidth={2} />
                </Link>
              </Button>
            </div>
          ) : null}
        </footer>
      </article>
    </Card>
  );
}
