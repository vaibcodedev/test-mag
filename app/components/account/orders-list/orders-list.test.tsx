import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { DEMO_ORDERS } from "~/components/account/account.fixtures";
import { DEFAULT_ORDERS_CHOICE } from "~/lib/account/orders-list";

import { OrdersList } from "./orders-list";

function renderList(props: Partial<Parameters<typeof OrdersList>[0]> = {}) {
  return render(
    <MemoryRouter initialEntries={["/account"]}>
      <OrdersList orders={DEMO_ORDERS} {...props} />
    </MemoryRouter>,
  );
}

describe("OrdersList", () => {
  it("показує кожне замовлення окремою карткою", () => {
    renderList();

    expect(screen.getByRole("heading", { level: 2, name: "Мої замовлення" })).toBeVisible();
    expect(screen.getAllByRole("article")).toHaveLength(DEMO_ORDERS.length);
    expect(screen.queryByRole("navigation", { name: "Сторінки замовлень" })).toBeNull();
  });

  it("веде на сусідні сторінки списку, зберігаючи шлях кабінету", () => {
    renderList({ previousHref: "?before=a", nextHref: "?after=b" });

    expect(screen.getByRole("link", { name: "Попередні замовлення" })).toHaveAttribute(
      "href",
      "/account?before=a",
    );
    expect(screen.getByRole("link", { name: "Наступні замовлення" })).toHaveAttribute(
      "href",
      "/account?after=b",
    );
  });

  it("під час завантаження сторінки позначає список зайнятим і показує індикатор", () => {
    const { rerender } = renderList({ nextHref: "?after=b" });
    const list = screen.getAllByRole("list").find((item) => item.hasAttribute("aria-busy"));
    expect(list).toHaveAttribute("aria-busy", "false");
    expect(screen.queryByRole("status", { name: "Завантажуємо замовлення" })).toBeNull();

    rerender(
      <MemoryRouter initialEntries={["/account"]}>
        <OrdersList orders={DEMO_ORDERS} nextHref="?after=b" busy />
      </MemoryRouter>,
    );
    expect(list).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status", { name: "Завантажуємо замовлення" })).toBeInTheDocument();
  });

  it("після переходу на іншу сторінку показує початок списку, а не лишає покупця внизу", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const { rerender } = renderList({ orders: DEMO_ORDERS.slice(0, 2), nextHref: "?after=b" });

    fireEvent.click(screen.getByRole("link", { name: "Наступні замовлення" }));
    expect(scrollIntoView).not.toHaveBeenCalled();

    rerender(
      <MemoryRouter initialEntries={["/account"]}>
        <OrdersList orders={DEMO_ORDERS.slice(2, 4)} previousHref="?before=c" />
      </MemoryRouter>,
    );
    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    // Звичайне оновлення списку (без кліку по сторінках) прокрутку не чіпає.
    rerender(
      <MemoryRouter initialEntries={["/account"]}>
        <OrdersList orders={DEMO_ORDERS.slice(0, 2)} />
      </MemoryRouter>,
    );
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("показує вибір періоду й сортування з поточними значеннями", () => {
    renderList({ choice: { sort: "expensive", period: "6m" } });

    const toolbar = screen.getByRole("group", { name: "Період і сортування замовлень" });
    expect(toolbar).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Період" })).toHaveTextContent("За пів року");
    expect(screen.getByRole("combobox", { name: "Сортування" })).toHaveTextContent(
      "Спочатку дорожчі",
    );
  });

  it("покупцеві без замовлень вибір не показує — лише запрошення до каталогу", () => {
    renderList({ orders: [], choice: DEFAULT_ORDERS_CHOICE });

    expect(screen.queryByRole("group", { name: "Період і сортування замовлень" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Замовлень поки немає" })).toBeVisible();
  });

  it("порожній період пояснює, що сталося, і веде до всіх замовлень, зберігаючи сортування", () => {
    renderList({ orders: [], choice: { sort: "old", period: "30d" } });

    expect(screen.getByRole("heading", { name: "За цей період замовлень немає" })).toBeVisible();
    expect(screen.getByRole("group", { name: "Період і сортування замовлень" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Усі замовлення" })).toHaveAttribute(
      "href",
      "/account?sort=old",
    );
  });
});
