import { CircleX, ExternalLink, Package, Truck } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Link } from "react-router";

import { AccountHelp } from "~/components/account/account-help";
import { itemCountLabel, OrderStatusBadges, StatusBadge } from "~/components/account/order-card";
import { ReorderButtonView, ReorderNotice } from "~/components/account/reorder-button";
import { PublishedDate } from "~/components/content/published-date";
import { Container } from "~/components/layout/container";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Card, CardTitle } from "~/components/ui/card";
import { ItemMedia } from "~/components/ui/item";
import { ShopImage } from "~/components/ui/shop-image";
import { useReorder } from "~/hooks/use-reorder";
import { formatPhone } from "~/lib/account/phone";
import type { ReorderOutcome } from "~/lib/account/reorder";
import type { StoreInfo } from "~/lib/content/site";
import { calendarDate, formatDate, formatPrice, type Money } from "~/lib/format";
import { cn } from "~/lib/utils";

import type {
  OrderAdjustments,
  OrderDetailsData,
  OrderDetailsLine,
  OrderRefund,
  OrderShipment,
} from "./order-details.types";
import { orderTotalRows, type OrderTotalRow } from "./order-totals";
import { addressLines, cancelReasonLabel, shipmentStatus, trackingHref } from "./shipment-status";

export type OrderDetailsProps = {
  order: OrderDetailsData;
  /** Знижки, спосіб доставки, повернення коштів; `null` — API їх не віддав. */
  adjustments?: OrderAdjustments | null;
  /** Відправлення; `null` — API їх не віддав. */
  shipments?: readonly OrderShipment[] | null;
  /** Контакти магазину для блоку допомоги. */
  store: StoreInfo;
  /** Стан «Повторити замовлення» для історій і тестів; на сайті його веде хук. */
  reorderState?: { pending: boolean; outcome: ReorderOutcome | null };
};

/** Та сама сітка «вміст + бічна колонка», що й у кабінеті. */
const LAYOUT = "grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-8";
const THUMB_SIZE = 64;
const THUMB_WIDTHS = [64, 128, 192] as const;
const DEFAULT_VARIANT_TITLE = "Default Title";

function isPositive(money: Money | null | undefined): money is Money {
  return money != null && Number.parseFloat(money.amount) > 0;
}

function dateLabel(iso: string | null | undefined): string | null {
  const date = iso ? calendarDate(iso) : null;
  return date ? formatDate(date.date) : null;
}

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const titleId = useId();

  return (
    <Card asChild className={cn("p-4 sm:p-6", className)}>
      <section aria-labelledby={titleId}>
        <CardTitle asChild size="h3">
          <h2 id={titleId}>{title}</h2>
        </CardTitle>
        {children}
      </section>
    </Card>
  );
}

function LineItem({ line }: { line: OrderDetailsLine }) {
  const variant = line.variantTitle?.trim();

  return (
    <li data-slot="order-line" className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <ItemMedia variant="image" fit="cover" className="size-16 text-muted-foreground">
        {line.image ? (
          <ShopImage
            src={line.image.url}
            alt=""
            width={line.image.width ?? THUMB_SIZE}
            height={line.image.height ?? THUMB_SIZE}
            sizes={`${THUMB_SIZE}px`}
            widths={THUMB_WIDTHS}
          />
        ) : (
          <Package aria-hidden="true" strokeWidth={2} className="size-6" />
        )}
      </ItemMedia>
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-card-title wrap-anywhere text-ink">{line.title}</p>
          {variant && variant !== DEFAULT_VARIANT_TITLE ? (
            <p className="text-small wrap-anywhere text-ink-2">{variant}</p>
          ) : null}
          <p className="text-small text-ink-2 tabular-nums">
            <span className="sr-only">Кількість і ціна за одиницю: </span>
            {line.quantity} шт.
            {line.price ? (
              <>
                <span aria-hidden="true"> × </span>
                <span className="sr-only"> по </span>
                {formatPrice(line.price)}
              </>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-0.5 sm:items-end">
          {line.totalPrice ? (
            <p className="text-body font-bold text-ink tabular-nums">
              <span className="sr-only">Сума: </span>
              {formatPrice(line.totalPrice)}
            </p>
          ) : null}
          {isPositive(line.totalDiscount) ? (
            <p className="text-caption font-semibold text-sale tabular-nums">
              Знижка −{formatPrice(line.totalDiscount)}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function TotalRow({ row }: { row: OrderTotalRow }) {
  const total = row.tone === "total";

  return (
    <div
      data-row={row.key}
      className={cn(
        "flex items-baseline justify-between gap-4",
        total ? "border-t border-line pt-3" : null,
      )}
    >
      <dt className={cn("min-w-0 wrap-anywhere", total ? "text-body font-bold" : "text-ink-2")}>
        {row.label}
        {row.note ? (
          <span className="block text-caption text-muted-foreground">{row.note}</span>
        ) : null}
      </dt>
      <dd
        className={cn(
          "shrink-0 tabular-nums",
          total ? "text-price" : "font-semibold",
          row.tone === "discount" ? "text-sale" : "text-ink",
        )}
      >
        {row.value}
      </dd>
    </div>
  );
}

function Shipment({
  shipment,
  index,
  count,
}: {
  shipment: OrderShipment;
  index: number;
  count: number;
}) {
  const status = shipmentStatus(shipment);
  const shipped = dateLabel(shipment.createdAt);
  const expected = dateLabel(shipment.estimatedDeliveryAt);
  const tracking = (shipment.trackingInformation ?? []).filter(
    (item) => item.number?.trim() || trackingHref(item.url),
  );
  const items = shipment.fulfillmentLineItems?.nodes ?? [];

  return (
    <li data-slot="order-shipment" className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 className="text-card-title text-ink">
          {count > 1 ? `Відправлення ${index + 1} з ${count}` : "Відправлення"}
        </h3>
        {status ? <StatusBadge status={status} prefix="Стан" neutralIcon={Truck} /> : null}
      </div>

      {shipped || expected ? (
        <p className="text-small text-ink-2">
          {[
            shipped ? `Відправлено ${shipped}` : null,
            expected ? `Очікуємо доставку ${expected}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}

      {tracking.length > 0 ? (
        <ul role="list" className="flex flex-col gap-2">
          {tracking.map((item, itemIndex) => {
            const href = trackingHref(item.url);
            const number = item.number?.trim();
            const company = item.company?.trim();

            return (
              <li
                key={`${number ?? ""}-${itemIndex}`}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md bg-page px-4 py-3"
              >
                <p className="min-w-0 text-small text-ink-2">
                  {company ? <span className="block">{company}</span> : null}
                  {number ? (
                    <span className="block font-semibold wrap-anywhere text-ink tabular-nums">
                      <span className="sr-only">Номер для відстеження: </span>
                      {number}
                    </span>
                  ) : null}
                </p>
                {href ? (
                  <Button asChild variant="surface" size="sm">
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      Відстежити
                      <ExternalLink aria-hidden="true" strokeWidth={2} className="size-4" />
                      <span className="sr-only"> (відкриється в новій вкладці)</span>
                    </a>
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-small text-ink-2">Номера для відстеження ще немає.</p>
      )}

      {items.length > 0 ? (
        <p className="text-small wrap-anywhere text-ink-2">
          <span className="font-semibold text-ink">У посилці: </span>
          {items
            .map(({ lineItem, quantity }) =>
              quantity && quantity > 1 ? `${lineItem.title} × ${quantity}` : lineItem.title,
            )
            .join("; ")}
        </p>
      ) : null}
    </li>
  );
}

function Refund({ refund }: { refund: OrderRefund }) {
  const date = dateLabel(refund.createdAt);
  const returnName = refund.returnName?.trim();

  return (
    <li className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <p className="min-w-0 text-small text-ink-2">
        <span className="block text-ink">{date ?? "Повернення коштів"}</span>
        {returnName ? (
          <span className="block wrap-anywhere">За поверненням {returnName}</span>
        ) : null}
      </p>
      <p className="shrink-0 font-semibold text-ink tabular-nums">
        {formatPrice(refund.totalRefunded)}
      </p>
    </li>
  );
}

/**
 * Сторінка одного замовлення: стан, товари, розрахунок, доставка, відправлення, повернення
 * коштів і «Повторити замовлення». Другорядні блоки з'являються лише тоді, коли для них є дані.
 */
export function OrderDetails({
  order,
  adjustments = null,
  shipments = null,
  store,
  reorderState,
}: OrderDetailsProps) {
  const hook = useReorder();
  const { pending, outcome } = reorderState ?? hook;

  const lines = order.lineItems.nodes;
  const totalQuantity = lines.reduce((sum, line) => sum + Math.max(line.quantity, 0), 0);
  const rows = orderTotalRows(order, adjustments);
  const address = addressLines(order.shippingAddress);
  const addressPhone = formatPhone(order.shippingAddress?.phoneNumber);
  const method = adjustments?.shippingLine?.title?.trim();
  const refunds = adjustments?.refunds ?? [];
  const cancelled = dateLabel(order.cancelledAt);
  const cancelReason = cancelReasonLabel(adjustments?.cancelReason);

  return (
    <Container data-slot="order-details" className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link viewTransition to="/account">
                Кабінет
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Замовлення {order.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-h2 wrap-anywhere text-ink">Замовлення {order.name}</h1>
            <p className="text-body text-ink-2">
              <PublishedDate value={order.processedAt} />
              {totalQuantity > 0 ? (
                <>
                  <span aria-hidden="true"> · </span>
                  <span className="sr-only">, </span>
                  {itemCountLabel(totalQuantity)}
                </>
              ) : null}
            </p>
          </div>
          <OrderStatusBadges order={order} className="[&_[data-slot=badge]]:bg-surface" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {lines.length > 0 ? (
            <ReorderButtonView
              orderName={order.name}
              pending={pending}
              onClick={() => void hook.reorder(order.id)}
            />
          ) : null}
          {/* Сторінка стану живе в Shopify, тому це звичайний <a>. */}
          <Button asChild variant="surface">
            <a href={order.statusPageUrl}>
              Відстеження й повернення
              <ExternalLink aria-hidden="true" strokeWidth={2} className="size-4" />
            </a>
          </Button>
        </div>
      </header>

      {outcome ? <ReorderNotice message={outcome.message} /> : null}

      {cancelled ? (
        <Alert variant="surface" data-slot="order-cancelled">
          <CircleX aria-hidden="true" strokeWidth={2} />
          <AlertTitle>Замовлення скасовано {cancelled}</AlertTitle>
          <AlertDescription>
            {cancelReason ? `Причина: ${cancelReason}. ` : null}
            Якщо ви вже оплатили, кошти повернуться тим самим способом. Питання? Напишіть нам.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className={LAYOUT}>
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Товари">
            {lines.length > 0 ? (
              <ul role="list" className="flex flex-col divide-y divide-line">
                {lines.map((line) => (
                  <LineItem key={line.id} line={line} />
                ))}
              </ul>
            ) : (
              <p className="text-small text-ink-2">У цьому замовленні немає товарів.</p>
            )}
            {order.lineItems.pageInfo?.hasNextPage ? (
              <p className="text-small text-ink-2">
                Показано перші {lines.length} позицій. Повний склад — на сторінці «Відстеження й
                повернення».
              </p>
            ) : null}
          </Panel>

          {shipments && shipments.length > 0 ? (
            <Panel title={shipments.length > 1 ? "Відправлення" : "Доставка посилки"}>
              <ul role="list" className="flex flex-col divide-y divide-line">
                {shipments.map((shipment, index) => (
                  <Shipment
                    key={shipment.id}
                    shipment={shipment}
                    index={index}
                    count={shipments.length}
                  />
                ))}
              </ul>
            </Panel>
          ) : null}

          {refunds.length > 0 ? (
            <Panel title="Повернення коштів">
              <ul role="list" className="flex flex-col divide-y divide-line">
                {refunds.map((refund) => (
                  <Refund key={refund.id} refund={refund} />
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>

        <aside aria-label="Підсумок і допомога" className="flex min-w-0 flex-col gap-6">
          <Panel title="Підсумок">
            <dl data-slot="order-totals" className="flex flex-col gap-3 text-small">
              {rows.map((row) => (
                <TotalRow key={row.key} row={row} />
              ))}
            </dl>
          </Panel>

          {method || address.length > 0 || addressPhone ? (
            <Panel title="Отримання">
              <dl className="flex flex-col gap-3 text-small">
                {method ? (
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-ink-2">Спосіб доставки</dt>
                    <dd className="font-semibold wrap-anywhere text-ink">{method}</dd>
                  </div>
                ) : null}
                {address.length > 0 ? (
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-ink-2">Адреса</dt>
                    <dd className="wrap-anywhere text-ink">
                      {address.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </dd>
                  </div>
                ) : null}
                {addressPhone ? (
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-ink-2">Телефон одержувача</dt>
                    <dd className="text-ink tabular-nums">{addressPhone}</dd>
                  </div>
                ) : null}
              </dl>
            </Panel>
          ) : null}

          <AccountHelp store={store} />
        </aside>
      </div>
    </Container>
  );
}
