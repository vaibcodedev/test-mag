import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { DEMO_ORDERS } from "~/components/account/account.fixtures";

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
    renderList({ newerHref: "?before=a", olderHref: "?after=b" });

    const newer = screen.getByRole("link", { name: "Новіші замовлення" });
    const older = screen.getByRole("link", { name: "Старіші замовлення" });
    expect(newer).toHaveAttribute("href", "/account?before=a");
    expect(older).toHaveAttribute("href", "/account?after=b");
  });

  it("під час завантаження сторінки позначає список зайнятим і показує індикатор", () => {
    const { rerender } = renderList({ olderHref: "?after=b" });
    const list = screen.getAllByRole("list").find((item) => item.hasAttribute("aria-busy"));
    expect(list).toHaveAttribute("aria-busy", "false");
    expect(screen.queryByRole("status", { name: "Завантажуємо замовлення" })).toBeNull();

    rerender(
      <MemoryRouter initialEntries={["/account"]}>
        <OrdersList orders={DEMO_ORDERS} olderHref="?after=b" busy />
      </MemoryRouter>,
    );
    expect(list).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status", { name: "Завантажуємо замовлення" })).toBeInTheDocument();
  });
});
