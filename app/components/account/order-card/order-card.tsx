import {
  ArrowRight,
  CircleCheck,
  CircleX,
  Clock,
  CreditCard,
  Package,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { useId, type ComponentProps } from "react";

import { PublishedDate } from "~/components/content/published-date";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardTitle } from "~/components/ui/card";
import { ItemMedia } from "~/components/ui/item";
import { Price } from "~/components/ui/price";
import { ShopImage } from "~/components/ui/shop-image";
import { cn } from "~/lib/utils";

import type { AccountOrder, OrderLineItem } from "./order-card.types";
import { itemCountLabel, orderItemsPreview, orderItemsSummary } from "./order-items";
import { orderStatuses, type OrderStatus } from "./order-status";

export type OrderCardProps = Omit<ComponentProps<"article">, "children"> & {
  order: AccountOrder;
};

const THUMB_SIZE = 56;
/** Плитка 48 на телефоні, 56 від sm: чотири плитки вміщаються в картку на 360px. */
const THUMB_CLASS = "size-12 sm:size-14";
const THUMB_WIDTHS = [56, 112, 168] as const;

function StatusBadge({
  status,
  prefix,
  neutralIcon,
  attentionIcon = Clock,
}: {
  status: OrderStatus;
  /** Що саме описує бейдж — для зчитувача екрана: «Оплата», «Доставка». */
  prefix: string;
  neutralIcon: LucideIcon;
  attentionIcon?: LucideIcon;
}) {
  const Icon =
    status.tone === "positive"
      ? CircleCheck
      : status.tone === "attention"
        ? attentionIcon
        : neutralIcon;

  return (
    <li>
      <Badge
        variant="chip"
        data-tone={status.tone}
        className={cn(
          "text-ink",
          status.tone === "positive" ? "[&>svg]:text-success" : "[&>svg]:text-ink-2",
        )}
      >
        <Icon aria-hidden="true" strokeWidth={2} />
        <span className="sr-only">{prefix}: </span>
        {status.label}
      </Badge>
    </li>
  );
}

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
 * Картка замовлення: номер, дата, стан оплати й доставки, що всередині, сума та
 * перехід на сторінку стану замовлення в Shopify.
 */
export function OrderCard({ order, className, ...props }: OrderCardProps) {
  const titleId = useId();
  const { payment, delivery } = orderStatuses(order);
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

        {payment || delivery ? (
          <ul role="list" aria-label="Стан замовлення" className="flex flex-wrap gap-2">
            {payment ? (
              <StatusBadge status={payment} prefix="Оплата" neutralIcon={CreditCard} />
            ) : null}
            {delivery ? (
              <StatusBadge
                status={delivery}
                prefix="Доставка"
                neutralIcon={Truck}
                attentionIcon={order.cancelledAt ? CircleX : Clock}
              />
            ) : null}
          </ul>
        ) : null}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
                <p className="line-clamp-2 min-w-0 text-small wrap-anywhere text-ink-2">
                  {summary}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Сторінка стану живе в Shopify, тому це звичайний <a>. */}
          <Button asChild variant="secondary" size="sm" className="shrink-0 md:ms-auto">
            <a href={order.statusPageUrl} aria-label={`Стан замовлення ${order.name}`}>
              Стан замовлення
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </a>
          </Button>
        </div>
      </article>
    </Card>
  );
}
