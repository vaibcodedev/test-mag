import { ArrowRight, Check, Clock, ExternalLink, Package, X } from "lucide-react";
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
import { orderHeadline, orderInProgress, paymentStatus } from "./order-status";

export type OrderCardProps = Omit<ComponentProps<"article">, "children"> & {
  order: AccountOrder;
};

const THUMB_SIZE = 72;
const THUMB_CLASS = "size-16 rounded-md sm:size-18";
const THUMB_WIDTHS = [72, 144, 216] as const;

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

/**
 * Картка замовлення. Угорі — стан одним рядком, номер, дата й сума; нижче — що всередині та,
 * доки замовлення в дорозі, шлях кроками. Дії: сторінка замовлення в кабінеті, «Повторити» і
 * сторінка стану в Shopify (відстеження, повернення).
 */
export function OrderCard({ order, className, ...props }: OrderCardProps) {
  const titleId = useId();
  const detailsPath = orderPath(order.id);
  const preview = orderItemsPreview(order);
  const summary = orderItemsSummary(preview);
  const headline = orderHeadline(order);
  const inProgress = orderInProgress(order);
  const payment = paymentStatus(order.financialStatus);
  const HeadlineIcon = headline.cancelled
    ? X
    : headline.tone === "positive"
      ? Check
      : headline.tone === "attention"
        ? Clock
        : Package;

  return (
    <Card asChild className={cn("gap-0 p-0", className)}>
      <article aria-labelledby={titleId} data-slot="order-card" {...props}>
        {/* Шапка: спершу стан — відповідь на «що з замовленням?», потім номер і дата. */}
        <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 p-4 sm:px-6 sm:pt-6 sm:pb-5">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <span
              aria-hidden="true"
              data-slot="order-status-icon"
              data-tone={headline.tone}
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-pill bg-page [&>svg]:size-5",
                headline.tone === "positive" ? "text-success" : "text-ink",
              )}
            >
              <HeadlineIcon strokeWidth={2} />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <p
                data-slot="order-headline"
                className="text-h3 wrap-anywhere max-sm:text-[1.125rem]"
              >
                <span className="sr-only">Стан: </span>
                {headline.label}
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
          </div>
          <div className="flex max-w-full min-w-0 flex-col gap-0.5 sm:items-end">
            <span className="text-caption text-ink-2">Разом</span>
            <Price price={order.totalPrice} className="wrap-anywhere" />
            {/* Оплата поруч із сумою; у замовлення в дорозі її вже показує шлях кроками. */}
            {payment && !inProgress ? (
              <span data-slot="order-payment" className="text-caption text-ink-2">
                <span className="sr-only">Оплата: </span>
                {payment.label}
              </span>
            ) : null}
          </div>
        </header>

        <div className="flex flex-col gap-5 border-t border-line px-4 py-4 empty:hidden sm:px-6 sm:py-5">
          {preview.thumbs.length > 0 || summary ? (
            <div className="flex items-center gap-4">
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
                        "bg-page text-body font-semibold text-ink tabular-nums max-sm:hidden",
                      )}
                    >
                      +{preview.hiddenCount}
                    </ItemMedia>
                  ) : null}
                </div>
              ) : null}
              <div className="flex min-w-0 flex-col gap-0.5">
                {summary ? (
                  <p className="line-clamp-3 text-body wrap-anywhere text-ink sm:line-clamp-2">
                    {summary}
                  </p>
                ) : null}
                {preview.totalQuantity > 0 ? (
                  <p className="text-small text-ink-2">{itemCountLabel(preview.totalQuantity)}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Шлях «оформлено → оплата → доставка» потрібен, доки замовлення в дорозі. */}
          {inProgress ? <OrderProgress order={order} /> : null}
        </div>

        <footer
          data-slot="order-actions"
          className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3 sm:px-6 sm:py-4"
        >
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
