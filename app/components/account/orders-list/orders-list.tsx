import { Package } from "lucide-react";
import { useId, type ComponentProps } from "react";
import { Link } from "react-router";

import { OrderCard, type AccountOrder } from "~/components/account/order-card";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import { Spinner } from "~/components/ui/spinner";
import { CATALOG_LINKS, type NavLink } from "~/lib/content/site";
import { cn } from "~/lib/utils";

export type OrdersListProps = Omit<ComponentProps<"section">, "children"> & {
  orders: readonly AccountOrder[];
  /** Адреси сусідніх сторінок списку; `null` — сторінки немає. */
  newerHref?: string | null;
  olderHref?: string | null;
  /** Триває перехід між сторінками списку. */
  busy?: boolean;
  /** Категорії-підказки для покупця без замовлень. */
  catalogLinks?: readonly NavLink[];
};

/** Скільки категорій показуємо в порожньому стані: решта є в каталозі. */
const EMPTY_CATEGORY_COUNT = 5;

function NoOrders({ catalogLinks }: { catalogLinks: readonly NavLink[] }) {
  return (
    <Empty size="panel" titleSize="h3">
      <EmptyHeader>
        <EmptyMedia>
          <Package strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle as="h3">Замовлень поки немає</EmptyTitle>
        <EmptyDescription>
          Щойно оформите покупку, вона з&apos;явиться тут: зі складом, сумою та станом оплати й
          доставки. А поки — оберіть, з чого почати.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <nav aria-label="Категорії каталогу" className="w-full">
          <ul role="list" className="flex flex-wrap gap-2">
            {catalogLinks.slice(0, EMPTY_CATEGORY_COUNT).map((link) => (
              <li key={link.to}>
                <Button asChild variant="secondary" size="sm" className="rounded-pill">
                  <Link viewTransition to={link.to} prefetch="intent">
                    {link.title}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
        <Button asChild>
          <Link viewTransition to="/collections" prefetch="intent">
            Увесь каталог
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

/** Замовлення покупця картками та перехід між сторінками списку. */
export function OrdersList({
  orders,
  newerHref,
  olderHref,
  busy = false,
  catalogLinks = CATALOG_LINKS,
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
      <div className="flex min-h-8 items-center gap-3">
        <h2 id={titleId} className="text-h3 text-ink">
          Мої замовлення
        </h2>
        {/* Спокійний стан завантаження: список тьмяніє на місці, без стрибків верстки. */}
        {busy ? <Spinner aria-label="Завантажуємо замовлення" className="text-ink-2" /> : null}
      </div>

      {orders.length === 0 ? (
        <NoOrders catalogLinks={catalogLinks} />
      ) : (
        <ul
          role="list"
          aria-busy={busy}
          className={cn(
            "flex flex-col gap-3 transition-opacity duration-150 motion-reduce:transition-none",
            busy ? "pointer-events-none opacity-50" : null,
          )}
        >
          {orders.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      )}

      {newerHref || olderHref ? (
        <Pagination aria-label="Сторінки замовлень">
          <PaginationContent className="w-full justify-between">
            {/* Без viewTransition: зміни всередині сторінки на сайті миттєві. */}
            {newerHref ? (
              <PaginationItem>
                <PaginationPrevious
                  asChild
                  showText="always"
                  text="Новіші"
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
                  text="Старіші"
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
