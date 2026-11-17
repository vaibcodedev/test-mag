import { CalendarX, Package } from "lucide-react";
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
import {
  ordersListFiltered,
  ordersListSearch,
  type OrdersListChoice,
} from "~/lib/account/orders-list";
import { CATALOG_LINKS, type NavLink } from "~/lib/content/site";
import { cn } from "~/lib/utils";

import { OrdersToolbar } from "./orders-toolbar";

export type OrdersListProps = Omit<ComponentProps<"section">, "children"> & {
  orders: readonly AccountOrder[];
  /** Вибрані сортування й період; без них панелі вибору немає. */
  choice?: OrdersListChoice;
  /** Адреси сусідніх сторінок списку; `null` — сторінки немає. */
  previousHref?: string | null;
  nextHref?: string | null;
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

/** Період, за який нічого не знайшлося: це не «замовлень ще немає», тож і порада інша. */
function NoOrdersInPeriod({ allHref }: { allHref: string }) {
  return (
    <Empty size="panel" titleSize="h3">
      <EmptyHeader>
        <EmptyMedia>
          <CalendarX strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle as="h3">За цей період замовлень немає</EmptyTitle>
        <EmptyDescription>
          Оберіть довший період або подивіться всі замовлення одразу.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link to={allHref} preventScrollReset>
            Усі замовлення
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

/**
 * Замовлення покупця картками: період і сортування вгорі, перехід між сторінками внизу.
 * Сторінки курсорні (так їх віддає Shopify), тому переходи — «попередні / наступні»,
 * без номерів.
 */
export function OrdersList({
  orders,
  choice,
  previousHref,
  nextHref,
  busy = false,
  catalogLinks = CATALOG_LINKS,
  className,
  ...props
}: OrdersListProps) {
  const titleId = useId();
  const filtered = choice ? ordersListFiltered(choice) : false;
  // Покупцеві без жодного замовлення вибирати нема з чого.
  const showToolbar = choice && (orders.length > 0 || filtered);

  return (
    <section
      aria-labelledby={titleId}
      data-slot="orders-list"
      className={cn("flex min-w-0 flex-col gap-4", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-h-8 items-center gap-3">
          <h2 id={titleId} className="text-h3 text-ink">
            Мої замовлення
          </h2>
          {/* Спокійний стан завантаження: список тьмяніє на місці, без стрибків верстки. */}
          {busy ? <Spinner aria-label="Завантажуємо замовлення" className="text-ink-2" /> : null}
        </div>
        {showToolbar ? <OrdersToolbar choice={choice} className="max-sm:w-full" /> : null}
      </div>

      {orders.length === 0 ? (
        filtered && choice ? (
          <NoOrdersInPeriod allHref={ordersListSearch({ ...choice, period: "all" }) || "?"} />
        ) : (
          <NoOrders catalogLinks={catalogLinks} />
        )
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

      {previousHref || nextHref ? (
        <Pagination aria-label="Сторінки замовлень">
          <PaginationContent className="w-full justify-between">
            {/* Без viewTransition: зміни всередині сторінки на сайті миттєві. */}
            {previousHref ? (
              <PaginationItem>
                <PaginationPrevious
                  asChild
                  showText="always"
                  text="Попередні"
                  aria-label="Попередні замовлення"
                >
                  <Link to={previousHref} preventScrollReset />
                </PaginationPrevious>
              </PaginationItem>
            ) : null}
            {nextHref ? (
              <PaginationItem className="ms-auto">
                <PaginationNext
                  asChild
                  showText="always"
                  text="Наступні"
                  aria-label="Наступні замовлення"
                >
                  <Link to={nextHref} preventScrollReset />
                </PaginationNext>
              </PaginationItem>
            ) : null}
          </PaginationContent>
        </Pagination>
      ) : null}
    </section>
  );
}
