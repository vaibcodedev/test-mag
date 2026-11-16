import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PackageSearch } from "lucide-react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { DEMO_PRODUCTS } from "~/components/home/home.fixtures";

import { ProductGrid, ProductGridSkeleton, type ProductGridProps } from "./product-grid";
import { ProductGridEmpty } from "./product-grid-empty";

const PRODUCTS = DEMO_PRODUCTS.slice(0, 7);

function renderGrid(props: Partial<ProductGridProps> = {}) {
  return render(
    <MemoryRouter>
      <ProductGrid data-testid="grid" products={PRODUCTS} {...props} />
    </MemoryRouter>,
  );
}

const eagerImages = (grid: HTMLElement) => grid.querySelectorAll("img[loading=eager]");
const lazyImages = (grid: HTMLElement) => grid.querySelectorAll("img[loading=lazy]");

describe("ProductGrid", () => {
  it("на всю ширину — 2 / 3 / 4 / 5 колонок", () => {
    renderGrid();
    const grid = screen.getByTestId("grid");

    expect(within(grid).getAllByRole("article")).toHaveLength(PRODUCTS.length);
    expect(grid).toHaveClass("grid-cols-2", "md:grid-cols-3", "lg:grid-cols-4", "xl:grid-cols-5");
  });

  it("поруч із фільтрами — 2 / 3 / 4 колонки", () => {
    renderGrid({ columns: "sidebar" });
    const grid = screen.getByTestId("grid");

    expect(grid).toHaveClass("grid-cols-2", "md:grid-cols-3", "xl:grid-cols-4");
    expect(grid).not.toHaveClass("xl:grid-cols-5");
    expect(grid).not.toHaveClass("lg:grid-cols-4");
  });

  it("фото першого рядка вантажаться без lazy, решта — ліниво", () => {
    const { unmount } = renderGrid();
    expect(eagerImages(screen.getByTestId("grid"))).toHaveLength(5);
    expect(lazyImages(screen.getByTestId("grid"))).toHaveLength(PRODUCTS.length - 5);
    unmount();

    renderGrid({ columns: "sidebar" });
    expect(eagerImages(screen.getByTestId("grid"))).toHaveLength(4);
  });

  it("«Купити» передає товар у onAddToCart, а картка показує завантаження", async () => {
    const onAddToCart = vi.fn();
    const [first, second] = PRODUCTS;
    renderGrid({ onAddToCart, addingHandle: second?.handle });
    const cards = screen.getAllByRole("article");

    await userEvent.click(within(cards[0] as HTMLElement).getByRole("button", { name: /Купити/ }));

    expect(onAddToCart).toHaveBeenCalledWith(first);
    expect(within(cards[1] as HTMLElement).getByRole("button", { name: /Купити/ })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("pending приглушує сітку й позначає її aria-busy", () => {
    const { unmount } = renderGrid();
    expect(screen.getByTestId("grid")).toHaveAttribute("aria-busy", "false");
    unmount();

    renderGrid({ pending: true });
    const grid = screen.getByTestId("grid");
    expect(grid).toHaveAttribute("aria-busy", "true");
    expect(grid).toHaveClass("opacity-60", "pointer-events-none");
  });

  it("loadingMore дописує заглушки в кінець", () => {
    renderGrid({ loadingMore: 3 });
    const grid = screen.getByTestId("grid");

    expect(grid).toHaveAttribute("aria-busy", "true");
    expect(within(grid).getAllByRole("status", { name: "Завантаження товару" })).toHaveLength(3);
    expect(within(grid).getAllByRole("article")).toHaveLength(PRODUCTS.length);
  });
});

describe("ProductGridSkeleton", () => {
  it("показує заглушки в тій самій сітці", () => {
    render(<ProductGridSkeleton data-testid="grid" columns="sidebar" count={6} />);
    const grid = screen.getByTestId("grid");

    expect(grid).toHaveAttribute("aria-busy", "true");
    expect(grid).toHaveClass("grid-cols-2", "xl:grid-cols-4");
    expect(within(grid).getAllByRole("status")).toHaveLength(6);
  });
});

describe("ProductGridEmpty", () => {
  it("показує заголовок, пояснення й дію", () => {
    render(
      <ProductGridEmpty
        icon={<PackageSearch />}
        title="Тут поки немає товарів"
        description="Подивіться інші розділи каталогу."
      >
        <a href="/collections">Перейти до каталогу</a>
      </ProductGridEmpty>,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Тут поки немає товарів" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Подивіться інші розділи каталогу.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Перейти до каталогу" })).toBeInTheDocument();
  });
});
