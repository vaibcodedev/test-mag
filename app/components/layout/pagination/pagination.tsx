import type { ComponentProps, MouseEvent } from "react";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";
import {
  Pagination as PaginationNav,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import { formatInteger } from "~/lib/format";
import { productCountLabel } from "~/lib/shopify/collection";
import { cn } from "~/lib/utils";

export type PaginationProps = Omit<ComponentProps<"nav">, "children"> & {
  /** Адреса попередньої сторінки з курсором ?before=; null — це перша сторінка. */
  previousHref: string | null;
  /** Адреса наступної сторінки з курсором ?after=; null — це остання сторінка. */
  nextHref: string | null;
  /** Скільки товарів зараз на сторінці. Без числа підсумок «Показано…» не виводимо. */
  shownCount?: number;
  /** Скільки товарів усього; null — невідомо, тоді «із M» не показуємо. */
  totalCount?: number | null;
  /** Додати головну дію «Показати ще»: вона веде на наступну сторінку. */
  showMore?: boolean;
  /** Наступна сторінка довантажується. */
  loading?: boolean;
  /**
   * Довантажити наступну сторінку без переходу. Без обробника (і без JavaScript)
   * «Показати ще» лишається звичайним посиланням на наступну сторінку.
   */
  onLoadMore?: (href: string, search: string) => void;
  /** Завчасне завантаження сусідніх сторінок. */
  prefetch?: "intent" | "none";
};

/**
 * Курсорна пагінація на частинах shadcn Pagination: «Попередня» й «Наступна», за потреби —
 * «Показати ще» та підсумок «Показано N із M».
 * Усе — звичайні GET-посилання, тому працює й без JavaScript.
 */
export function Pagination({
  previousHref,
  nextHref,
  shownCount,
  totalCount = null,
  showMore = false,
  loading = false,
  onLoadMore,
  prefetch = "none",
  className,
  "aria-label": ariaLabel = "Сторінки",
  ...props
}: PaginationProps) {
  const summary =
    shownCount == null || shownCount === 0
      ? null
      : totalCount == null
        ? `Показано ${productCountLabel(shownCount)}`
        : `Показано ${formatInteger(shownCount)} із ${formatInteger(totalCount)}`;

  if (!nextHref && !previousHref) {
    return summary ? (
      <p data-slot="pagination-summary" className="text-center text-small text-muted-foreground">
        {summary}
      </p>
    ) : null;
  }

  function loadMore(event: MouseEvent<HTMLAnchorElement>) {
    if (!onLoadMore || !nextHref) return;
    // Ctrl/⌘-клік відкриває наступну сторінку в новій вкладці, як звичайне посилання.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!loading) onLoadMore(nextHref, nextHref.slice(nextHref.indexOf("?") + 1));
  }

  return (
    <PaginationNav
      aria-label={ariaLabel}
      className={cn("flex-col items-center gap-4", className)}
      {...props}
    >
      {summary ? (
        <p
          data-slot="pagination-summary"
          aria-live="polite"
          className="text-small text-muted-foreground"
        >
          {summary}
        </p>
      ) : null}

      {showMore && nextHref ? (
        <Button asChild variant="surface" size="lg">
          <Link
            to={nextHref}
            preventScrollReset
            aria-busy={loading || undefined}
            onClick={loadMore}
          >
            {loading ? "Завантажуємо товари…" : "Показати ще"}
          </Link>
        </Button>
      ) : null}

      <PaginationContent className="gap-3">
        {previousHref ? (
          <PaginationItem>
            <PaginationPrevious asChild>
              <Link to={previousHref} prefetch={prefetch} />
            </PaginationPrevious>
          </PaginationItem>
        ) : null}
        {nextHref ? (
          <PaginationItem>
            <PaginationNext asChild>
              <Link to={nextHref} prefetch={prefetch} />
            </PaginationNext>
          </PaginationItem>
        ) : null}
      </PaginationContent>
    </PaginationNav>
  );
}
