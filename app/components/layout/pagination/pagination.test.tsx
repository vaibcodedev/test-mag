import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { pageHrefs, type CollectionPageInfo } from "~/lib/shopify/collection";

import { Pagination, type PaginationProps } from "./pagination";

const PAGE_INFO = {
  hasNextPage: true,
  hasPreviousPage: true,
  startCursor: "start-1",
  endCursor: "end-1",
};

type RenderProps = Partial<PaginationProps> & { pageInfo?: CollectionPageInfo };

/** Як на сторінці колекції: «Показати ще», підсумок і адреси з курсорів pageInfo. */
function renderPagination({ pageInfo = PAGE_INFO, ...props }: RenderProps = {}) {
  return render(
    <MemoryRouter>
      <Pagination
        {...pageHrefs(
          "/collections/iphone",
          "?filter.v.price.gte=100&sort_by=price-ascending&after=old",
          pageInfo,
        )}
        showMore
        shownCount={24}
        totalCount={96}
        {...props}
      />
    </MemoryRouter>,
  );
}

const NEXT = "/collections/iphone?filter.v.price.gte=100&sort_by=price-ascending&after=end-1";
const PREVIOUS =
  "/collections/iphone?filter.v.price.gte=100&sort_by=price-ascending&before=start-1";

describe("Pagination", () => {
  it("посилання несуть курсор і зберігають фільтри та сортування", () => {
    renderPagination();

    expect(screen.getByRole("link", { name: "Показати ще" })).toHaveAttribute("href", NEXT);
    const next = screen.getByRole("link", { name: "Наступна сторінка" });
    expect(next).toHaveAttribute("href", NEXT);
    expect(next).toHaveAttribute("rel", "next");
    const previous = screen.getByRole("link", { name: "Попередня сторінка" });
    expect(previous).toHaveAttribute("href", PREVIOUS);
    expect(previous).toHaveAttribute("rel", "prev");
  });

  it("показує «Показано N із M», коли загальна кількість відома", () => {
    renderPagination();

    expect(screen.getByText("Показано 24 із 96")).toBeInTheDocument();
  });

  it("без загальної кількості показує лише число на сторінці", () => {
    renderPagination({ totalCount: null });

    expect(screen.getByText("Показано 24 товари")).toBeInTheDocument();
  });

  it("на першій сторінці немає «Попередня», на останній — «Показати ще»", () => {
    const { unmount } = renderPagination({
      pageInfo: { ...PAGE_INFO, hasPreviousPage: false },
    });
    expect(screen.queryByRole("link", { name: "Попередня сторінка" })).toBeNull();
    expect(screen.getByRole("link", { name: "Показати ще" })).toBeInTheDocument();
    unmount();

    renderPagination({ pageInfo: { ...PAGE_INFO, hasNextPage: false } });
    expect(screen.queryByRole("link", { name: "Показати ще" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Наступна сторінка" })).toBeNull();
    expect(screen.getByRole("link", { name: "Попередня сторінка" })).toBeInTheDocument();
  });

  it("єдина сторінка: лише підсумок, без навігації", () => {
    renderPagination({
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
      shownCount: 9,
      totalCount: 9,
    });

    expect(screen.getByText("Показано 9 із 9")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("порожній список нічого не показує", () => {
    const { container } = renderPagination({
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
      shownCount: 0,
      totalCount: 0,
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("«Показати ще» довантажує сторінку обробником замість переходу", async () => {
    const onLoadMore = vi.fn();
    renderPagination({ onLoadMore });

    await userEvent.click(screen.getByRole("link", { name: "Показати ще" }));

    expect(onLoadMore).toHaveBeenCalledWith(
      NEXT,
      "filter.v.price.gte=100&sort_by=price-ascending&after=end-1",
    );
  });

  it("під час завантаження не запускає друге довантаження", async () => {
    const onLoadMore = vi.fn();
    renderPagination({ onLoadMore, loading: true });

    await userEvent.click(screen.getByRole("link", { name: "Завантажуємо товари…" }));

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("Ctrl+клік по «Показати ще» лишається звичайним переходом", async () => {
    const onLoadMore = vi.fn();
    renderPagination({ onLoadMore });
    const user = userEvent.setup();

    await user.keyboard("{Control>}");
    await user.click(screen.getByRole("link", { name: "Показати ще" }));
    await user.keyboard("{/Control}");

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("без showMore лишаються тільки посилання на сусідні сторінки", () => {
    renderPagination({
      showMore: false,
      shownCount: undefined,
      "aria-label": "Сторінки результатів",
    });
    const nav = screen.getByRole("navigation", { name: "Сторінки результатів" });

    expect(screen.queryByRole("link", { name: "Показати ще" })).toBeNull();
    expect(screen.queryByText(/Показано/)).toBeNull();
    expect(within(nav).getAllByRole("link")).toHaveLength(2);
    expect(within(nav).getByRole("link", { name: "Попередня сторінка" })).toHaveAttribute(
      "href",
      PREVIOUS,
    );
    expect(within(nav).getByRole("link", { name: "Наступна сторінка" })).toHaveAttribute(
      "href",
      NEXT,
    );
  });

  it("без підсумку й сусідніх сторінок нічого не показує", () => {
    const { container } = renderPagination({
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
      shownCount: undefined,
    });

    expect(container).toBeEmptyDOMElement();
  });
});
