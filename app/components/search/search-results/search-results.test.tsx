import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { DEMO_PRODUCTS } from "~/components/home/home.fixtures";

import { SearchResults, type SearchResultsProps } from "./search-results";

const NO_PAGES = { previousHref: null, nextHref: null };

function renderResults(props: Partial<SearchResultsProps> = {}) {
  return render(
    <MemoryRouter>
      <SearchResults products={DEMO_PRODUCTS.slice(0, 3)} pagination={NO_PAGES} {...props} />
    </MemoryRouter>,
  );
}

describe("SearchResults", () => {
  it("рендерить сітку карток на 2 / 3 / 4 / 5 колонок", () => {
    renderResults();
    const grid = screen.getByTestId("product-grid");

    expect(within(grid).getAllByRole("article")).toHaveLength(3);
    expect(grid).toHaveClass("grid-cols-2", "md:grid-cols-3", "lg:grid-cols-4", "xl:grid-cols-5");
  });

  it("«Купити» передає товар у onAddToCart, а картка показує завантаження", async () => {
    const onAddToCart = vi.fn();
    const [first, second] = DEMO_PRODUCTS;
    renderResults({ onAddToCart, addingHandle: second?.handle });
    const cards = screen.getAllByRole("article");

    await userEvent
      .setup()
      .click(within(cards[0] as HTMLElement).getByRole("button", { name: /Купити/ }));

    expect(onAddToCart).toHaveBeenCalledWith(first);
    expect(within(cards[1] as HTMLElement).getByRole("button", { name: /Купити/ })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("без сусідніх сторінок навігації немає", () => {
    renderResults();

    expect(screen.queryByRole("navigation", { name: "Сторінки результатів" })).toBeNull();
  });

  it("пагінація — звичайні посилання з rel prev / next", () => {
    renderResults({
      pagination: {
        previousHref: "/search?q=iphone&before=abc",
        nextHref: "/search?q=iphone&after=xyz",
      },
    });
    const nav = screen.getByRole("navigation", { name: "Сторінки результатів" });

    const previous = within(nav).getByRole("link", { name: "Попередня сторінка" });
    const next = within(nav).getByRole("link", { name: "Наступна сторінка" });
    expect(previous).toHaveAttribute("href", "/search?q=iphone&before=abc");
    expect(previous).toHaveAttribute("rel", "prev");
    expect(next).toHaveAttribute("href", "/search?q=iphone&after=xyz");
    expect(next).toHaveAttribute("rel", "next");
  });
});
