import { render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

import { orderStatusLabel } from "~/components/account/orders-list";
import { STORE_INFO } from "~/lib/content/site";

import { AccountView, type AccountCustomer, type AccountState } from "./account-view";

/** useNavigation потребує data-роутера, тому MemoryRouter тут не підходить. */
function renderView(state: AccountState) {
  const router = createMemoryRouter(
    [{ path: "/account", element: <AccountView state={state} store={STORE_INFO} /> }],
    { initialEntries: ["/account"] },
  );
  return render(<RouterProvider router={router} />);
}

const text = (element: HTMLElement) => (element.textContent ?? "").replace(/\s/g, " ");

const CUSTOMER: AccountCustomer = {
  firstName: "Олена",
  lastName: "Коваль",
  emailAddress: { emailAddress: "olena@example.com" },
  orders: {
    nodes: [
      {
        id: "gid://shopify/Order/1",
        name: "#1001",
        processedAt: "2026-11-18T10:00:00Z",
        financialStatus: "PAID",
        statusPageUrl: "https://shop.example/orders/1",
        totalPrice: { amount: "64999.0", currencyCode: "UAH" },
      },
    ],
    pageInfo: { hasNextPage: true, hasPreviousPage: false, startCursor: "s", endCursor: "e=1" },
  },
};

describe("AccountView", () => {
  it("має один h1 у кожному стані", () => {
    renderView({ status: "unavailable" });

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Особистий кабінет" })).toBeVisible();
  });

  it("без Customer Account API пояснює українською, що вхід запрацює після підключення магазину", () => {
    renderView({ status: "unavailable" });

    expect(
      screen.getByRole("heading", { name: "Вхід запрацює після підключення магазину" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Перейти до каталогу" })).toHaveAttribute(
      "href",
      "/collections",
    );
    expect(screen.getByRole("link", { name: /Написати в Telegram/ })).toHaveAttribute(
      "href",
      STORE_INFO.telegramUrl,
    );
    expect(screen.queryByText(/SHOP_ID|SESSION_SECRET|Customer Accounts/)).toBeNull();
  });

  it("неавторизованому показує вхід звичайним посиланням і помилку після невдалої спроби", () => {
    const { unmount } = renderView({ status: "signed-out", loginFailed: false });

    expect(screen.getByRole("link", { name: "Увійти" })).toHaveAttribute("href", "/account/login");
    expect(screen.queryByRole("alert")).toBeNull();
    unmount();

    renderView({ status: "signed-out", loginFailed: true });
    expect(screen.getByRole("alert")).toHaveTextContent("Не вдалося увійти. Спробуйте ще раз.");
  });

  it("у разі помилки дає оновити сторінку та вийти", () => {
    const { container } = renderView({ status: "error" });

    expect(screen.getByRole("heading", { name: "Не вдалося завантажити кабінет" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Вийти з кабінету" })).toHaveAttribute(
      "type",
      "submit",
    );
    const form = container.querySelector("form");
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "/account/logout");
  });

  it("показує профіль і замовлення: номер, дата, стан, сума, пагінація", () => {
    renderView({ status: "signed-in", customer: CUSTOMER });

    expect(screen.getByRole("heading", { level: 2, name: "Олена Коваль" })).toBeInTheDocument();
    expect(screen.getByText("olena@example.com")).toBeInTheDocument();

    const order = screen.getByRole("link", { name: "Замовлення #1001" });
    expect(order).toHaveAttribute("href", "https://shop.example/orders/1");
    const row = order.closest("li") as HTMLElement;
    expect(within(row).getByText("18 листопада 2026 р.")).toHaveAttribute("datetime", "2026-11-18");
    expect(within(row).getByText("Оплачено")).toBeInTheDocument();
    expect(text(row)).toContain("64 999 ₴");

    expect(screen.getByRole("link", { name: "Старіші замовлення" })).toHaveAttribute(
      "href",
      "/account?after=e%3D1",
    );
    expect(screen.queryByRole("link", { name: "Новіші замовлення" })).toBeNull();
  });

  it("без замовлень запрошує до каталогу, без імені — нейтральний заголовок профілю", () => {
    renderView({
      status: "signed-in",
      customer: {
        orders: {
          nodes: [],
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
        },
      },
    });

    expect(screen.getByRole("heading", { level: 2, name: "Ваш профіль" })).toBeInTheDocument();
    expect(screen.getByText(/Ви ще нічого не замовляли/)).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Сторінки замовлень" })).toBeNull();
  });
});

describe("orderStatusLabel", () => {
  it("перекладає стани оплати й ховає невідомі", () => {
    expect(orderStatusLabel("PENDING")).toBe("Очікує оплати");
    expect(orderStatusLabel("REFUNDED")).toBe("Кошти повернено");
    expect(orderStatusLabel("SOMETHING_NEW")).toBeNull();
    expect(orderStatusLabel("toString")).toBeNull();
    expect(orderStatusLabel(null)).toBeNull();
  });
});
