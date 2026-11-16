import { Package } from "lucide-react";
import { useId, type ComponentProps } from "react";
import { Link } from "react-router";

import { PublishedDate } from "~/components/content/published-date";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "~/components/ui/item";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import { Price } from "~/components/ui/price";
import type { Money } from "~/lib/format";
import { cn } from "~/lib/utils";

export type AccountOrder = {
  id: string;
  /** Номер замовлення, як у листі: «#1001». */
  name: string;
  /** Дата оформлення в ISO 8601. */
  processedAt: string;
  /** Стан оплати з Customer Account API: PAID, PENDING … */
  financialStatus?: string | null;
  /** Сторінка стану замовлення в Shopify. */
  statusPageUrl: string;
  totalPrice: Money;
};

export type OrdersListProps = Omit<ComponentProps<"section">, "children"> & {
  orders: readonly AccountOrder[];
  /** Адреси сусідніх сторінок списку; `null` — сторінки немає. */
  newerHref?: string | null;
  olderHref?: string | null;
  /** Триває перехід між сторінками списку. */
  busy?: boolean;
};

const FINANCIAL_STATUS: Record<string, string> = {
  AUTHORIZED: "Кошти зарезервовано",
  EXPIRED: "Термін оплати минув",
  PAID: "Оплачено",
  PARTIALLY_PAID: "Оплачено частково",
  PARTIALLY_REFUNDED: "Частину коштів повернено",
  PENDING: "Очікує оплати",
  REFUNDED: "Кошти повернено",
  VOIDED: "Оплату скасовано",
};

/** Стан оплати українською; невідомий код не показуємо, щоб не лишати англійський текст. */
export function orderStatusLabel(status: string | null | undefined): string | null {
  if (!status || !Object.hasOwn(FINANCIAL_STATUS, status)) return null;
  return FINANCIAL_STATUS[status] ?? null;
}

/** Замовлення покупця: номер, дата, стан оплати, сума та перехід між сторінками списку. */
export function OrdersList({
  orders,
  newerHref,
  olderHref,
  busy = false,
  className,
  ...props
}: OrdersListProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      data-slot="orders-list"
      className={cn("flex min-w-0 flex-col gap-4", className)}
      {...props}
    >
      <h2 id={titleId} className="text-h3 text-ink">
        Замовлення
      </h2>

      {orders.length === 0 ? (
        <Empty size="sm">
          <EmptyHeader>
            <EmptyMedia>
              <Package strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle as="h3">Замовлень поки немає</EmptyTitle>
            <EmptyDescription>
              Ви ще нічого не замовляли. Щойно оформите покупку, вона з&apos;явиться тут разом зі
              статусом і сумою.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link to="/collections" prefetch="intent">
                Перейти до каталогу
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ItemGroup
          asChild
          className={cn("transition-opacity duration-150", busy ? "opacity-50" : null)}
        >
          <ul role="list" aria-busy={busy}>
            {orders.map((order) => {
              const status = orderStatusLabel(order.financialStatus);

              return (
                <li key={order.id}>
                  <Item variant="outline" className="gap-y-2 py-3">
                    <ItemContent>
                      <ItemTitle>
                        <Button asChild variant="link" className="min-h-11">
                          <a href={order.statusPageUrl}>Замовлення {order.name}</a>
                        </Button>
                      </ItemTitle>
                      <ItemDescription>
                        <PublishedDate value={order.processedAt} />
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions className="gap-4">
                      {status ? <Badge variant="outline">{status}</Badge> : null}
                      <Price price={order.totalPrice} />
                    </ItemActions>
                  </Item>
                </li>
              );
            })}
          </ul>
        </ItemGroup>
      )}

      {newerHref || olderHref ? (
        <Pagination aria-label="Сторінки замовлень">
          <PaginationContent className="w-full justify-between">
            {newerHref ? (
              <PaginationItem>
                <PaginationPrevious
                  asChild
                  showText="always"
                  text="Новіші замовлення"
                  aria-label="Новіші замовлення"
                >
                  <Link to={newerHref} preventScrollReset />
                </PaginationPrevious>
              </PaginationItem>
            ) : null}
            {olderHref ? (
              <PaginationItem className="ms-auto">
                <PaginationNext
                  asChild
                  showText="always"
                  text="Старіші замовлення"
                  aria-label="Старіші замовлення"
                >
                  <Link to={olderHref} preventScrollReset />
                </PaginationNext>
              </PaginationItem>
            ) : null}
          </PaginationContent>
        </Pagination>
      ) : null}
    </section>
  );
}
