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
import { OrderStatusBadges } from "./order-status-badges";

export type OrderCardProps = Omit<ComponentProps<"article">, "children"> & {
  order: AccountOrder;
};

const THUMB_SIZE = 56;
/** Плитка 48 на телефоні, 56 від sm: чотири плитки вміщаються в картку на 360px. */
const THUMB_CLASS = "size-12 sm:size-14";
const THUMB_WIDTHS = [56, 112, 168] as const;

function Thumb({ item }: { item: OrderLineItem }) {
  return (
    <ItemMedia variant="image" fit="cover" className={cn(THUMB_CLASS, "text-muted-foreground")}>
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
 * Картка замовлення: номер, дата, стан оплати й доставки, що всередині й сума. Дії: сторінка
 * замовлення в кабінеті, «Повторити» і сторінка стану в Shopify (відстеження, повернення).
 */
export function OrderCard({ order, className, ...props }: OrderCardProps) {
  const titleId = useId();
  const detailsPath = orderPath(order.id);
  const preview = orderItemsPreview(order);
  const summary = orderItemsSummary(preview);

  return (
    <Card asChild className={cn("p-4 sm:p-6", className)}>
      <article aria-labelledby={titleId} data-slot="order-card" {...props}>
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3">
            <CardTitle asChild className="min-w-0 text-body font-bold wrap-anywhere">
              <h3 id={titleId}>Замовлення {order.name}</h3>
            </CardTitle>
            <Price price={order.totalPrice} className="shrink-0" />
          </div>
          <p className="text-small text-ink-2">
            <PublishedDate value={order.processedAt} />
            {preview.totalQuantity > 0 ? (
              <>
                <span aria-hidden="true"> · </span>
                <span className="sr-only">, </span>
                {itemCountLabel(preview.totalQuantity)}
              </>
            ) : null}
          </p>
        </div>

        <OrderStatusBadges order={order} />

        {preview.thumbs.length > 0 ? (
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Мініатюри декоративні: склад замовлення названо текстом поруч. */}
            <div aria-hidden="true" data-slot="order-thumbs" className="flex shrink-0 gap-2">
              {preview.thumbs.map((item) => (
                <Thumb key={item.id} item={item} />
              ))}
              {preview.hiddenCount > 0 ? (
                <ItemMedia
                  variant="image"
                  data-thumb="more"
                  className={cn(
                    THUMB_CLASS,
                    "bg-page text-small font-semibold text-ink tabular-nums",
                  )}
                >
                  +{preview.hiddenCount}
                </ItemMedia>
              ) : null}
            </div>
            {summary ? (
              <p className="line-clamp-2 min-w-0 text-small wrap-anywhere text-ink-2">{summary}</p>
            ) : null}
          </div>
        ) : null}

        <div data-slot="order-actions" className="flex flex-wrap items-center gap-x-2 gap-y-3">
          {detailsPath ? (
            <Button asChild variant="secondary" size="sm">
              <Link viewTransition to={detailsPath} aria-label={`Деталі замовлення ${order.name}`}>
                Деталі
                <ArrowRight aria-hidden="true" strokeWidth={2} />
              </Link>
            </Button>
          ) : null}
          {/* Повторити можна лише замовлення з позиціями: порожнє нічого не додасть. */}
          {detailsPath && preview.lineCount > 0 ? (
            <ReorderButton
              orderId={order.id}
              orderName={order.name}
              variant="secondary"
              size="sm"
              compact
            />
          ) : null}
          {/* Сторінка стану живе в Shopify, тому це звичайний <a>. */}
          <Button asChild variant="link" size="sm" className="min-h-11 sm:ms-auto">
            <a href={order.statusPageUrl} aria-label={`Стан замовлення ${order.name}`}>
              Стан замовлення
              <ExternalLink aria-hidden="true" strokeWidth={2} className="size-4" />
            </a>
          </Button>
        </div>
      </article>
    </Card>
  );
}
