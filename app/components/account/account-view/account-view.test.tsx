import { render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";

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
        fulfillmentStatus: "UNFULFILLED",
        statusPageUrl: "https://shop.example/orders/1",
        totalPrice: { amount: "64999.0", currencyCode: "UAH" },
        lineItemsSummary: { lineItemCount: 1, totalQuantityOfLineItems: 1 },
        lineItems: {
          nodes: [{ id: "line-1", title: "iPhone 17 Pro 256 ГБ", quantity: 1, image: null }],
        },
      },
    ],
    pageInfo: { hasNextPage: true, hasPreviousPage: false, startCursor: "s", endCursor: "e=1" },
  },
};

const NO_ORDERS: AccountCustomer["orders"] = {
  nodes: [],
  pageInfo: { hasNextPage: false, hasPreviousPage: false },
};

const STATES: AccountState[] = [
  { status: "unavailable" },
  { status: "signed-out", loginFailed: false },
  { status: "signed-out", loginFailed: true },
  { status: "error" },
  { status: "signed-in", customer: CUSTOMER },
  { status: "signed-in", customer: { orders: NO_ORDERS } },
];

describe("AccountView", () => {
  it("має рівно один h1 і не пропускає рівнів заголовків у кожному стані", () => {
    for (const state of STATES) {
      const { unmount } = renderView(state);

      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      const levels = screen.getAllByRole("heading").map((heading) => Number(heading.tagName[1]));
      expect(levels[0]).toBe(1);
      levels.forEach((level, index) => {
        if (index > 0) expect(level - (levels[index - 1] as number)).toBeLessThanOrEqual(1);
      });
      unmount();
    }
  });

  it("без Customer Account API пояснює українською, що вхід запрацює після підключення магазину", () => {
    renderView({ status: "unavailable" });

    expect(screen.getByRole("heading", { level: 1, name: "Особистий кабінет" })).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 2, name: "Вхід запрацює після підключення магазину" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Вхід у кабінет ще не налаштовано: він запрацює, щойно магазин під'єднають до Shopify. Купувати можна й без входу, а про статус замовлення запитайте нас у Telegram або телефоном.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Перейти до каталогу" })).toHaveAttribute(
      "href",
      "/collections",
    );
    expect(screen.getByRole("link", { name: /Написати в Telegram/ })).toHaveAttribute(
      "href",
      STORE_INFO.telegramUrl,
    );
    expect(screen.getByRole("link", { name: /Телефон/ })).toHaveAttribute(
      "href",
      STORE_INFO.phoneHref,
    );
    expect(screen.queryByText(/SHOP_ID|SESSION_SECRET|Customer Accounts/)).toBeNull();
  });

  it("неавторизованому пояснює вхід без пароля й дає одну головну дію звичайним посиланням", () => {
    renderView({ status: "signed-out", loginFailed: false });

    expect(screen.getByRole("heading", { level: 1, name: "Особистий кабінет" })).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 2, name: "Увійдіть, щоб бачити свої замовлення" }),
    ).toBeVisible();
    expect(screen.getByText(/Пароль не потрібен/)).toBeInTheDocument();
    expect(screen.getByText(/одноразовий код/)).toBeInTheDocument();
    expect(screen.getByText(/Купувати можна й без кабінету/)).toBeInTheDocument();

    const login = screen.getByRole("link", { name: "Увійти" });
    expect(login).toHaveAttribute("href", "/account/login");
    // Вхід — повне завантаження документа, тож це <a> без клієнтської навігації.
    expect(login).not.toHaveAttribute("data-discover");
    expect(screen.queryByRole("alert")).toBeNull();

    const benefits = screen.getByRole("region", { name: "Що є в кабінеті" });
    expect(within(benefits).getAllByRole("listitem")).toHaveLength(3);
  });

  it("після невдалої спроби показує помилку й пропонує увійти ще раз", () => {
    renderView({ status: "signed-out", loginFailed: true });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Не вдалося увійти");
    expect(alert).toHaveTextContent("Спробуйте ще раз");
    expect(screen.getByRole("link", { name: "Увійти ще раз" })).toHaveAttribute(
      "href",
      "/account/login",
    );
  });

  it("у разі помилки дає спробувати ще раз, вийти та зв'язатися з магазином", () => {
    const { container } = renderView({ status: "error" });

    expect(screen.getByRole("heading", { name: "Не вдалося завантажити кабінет" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Спробувати ще раз" })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(screen.getByRole("button", { name: "Вийти з кабінету" })).toHaveAttribute(
      "type",
      "submit",
    );
    const form = container.querySelector("form");
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "/account/logout");

    const contacts = screen.getByRole("region", { name: "Потрібна допомога?" });
    expect(within(contacts).getByRole("link", { name: /Telegram/ })).toHaveAttribute(
      "href",
      STORE_INFO.telegramUrl,
    );
    expect(within(contacts).getByRole("link", { name: /Телефон/ })).toHaveAttribute(
      "href",
      STORE_INFO.phoneHref,
    );
  });

  it("вітає покупця на ім'я, показує профіль, картку замовлення й пагінацію", () => {
    const { container } = renderView({ status: "signed-in", customer: CUSTOMER });

    expect(screen.getByRole("heading", { level: 1, name: "Вітаємо, Олена!" })).toBeVisible();
    expect(screen.getByText("Олена Коваль")).toBeInTheDocument();
    expect(screen.getByText("olena@example.com")).toBeInTheDocument();
    expect(container.querySelector("form")).toHaveAttribute("action", "/account/logout");

    const card = screen.getByRole("article", { name: "Замовлення #1001" });
    expect(within(card).getByText("18 листопада 2026 р.")).toHaveAttribute(
      "datetime",
      "2026-11-18",
    );
    expect(within(card).getByText("Оплачено")).toBeInTheDocument();
    expect(within(card).getByText("Готуємо до відправлення")).toBeInTheDocument();
    expect(within(card).getByText("iPhone 17 Pro 256 ГБ")).toBeInTheDocument();
    expect(text(card)).toContain("1 товар");
    expect(text(card)).toContain("64 999 ₴");
    expect(within(card).getByRole("link", { name: "Стан замовлення #1001" })).toHaveAttribute(
      "href",
      "https://shop.example/orders/1",
    );

    const older = screen.getByRole("link", { name: "Старіші замовлення" });
    expect(older).toHaveAttribute("href", "/account?after=e%3D1");
    expect(screen.queryByRole("link", { name: "Новіші замовлення" })).toBeNull();
  });

  it("дає швидкі переходи до обраного, порівняння, кошика, сервісу й контактів", () => {
    renderView({ status: "signed-in", customer: CUSTOMER });

    const aside = screen.getByRole("complementary", { name: "Корисне" });
    for (const [name, href] of [
      ["Обране", "/wishlist"],
      ["Порівняння", "/compare"],
      ["Кошик", "/cart"],
      ["Гарантія", "/pages/warranty"],
      ["Обмін і повернення", "/pages/returns"],
      ["Доставка й оплата", "/pages/delivery"],
      ["Trade-in", "/pages/trade-in"],
    ] as const) {
      expect(within(aside).getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(within(aside).getByRole("link", { name: /Telegram/ })).toHaveAttribute(
      "href",
      STORE_INFO.telegramUrl,
    );
    expect(within(aside).getByRole("link", { name: /Телефон/ })).toHaveAttribute(
      "href",
      STORE_INFO.phoneHref,
    );
  });

  it("без замовлень веде до каталогу, без імені вітає нейтрально", () => {
    renderView({ status: "signed-in", customer: { orders: NO_ORDERS } });

    expect(screen.getByRole("heading", { level: 1, name: "Вітаємо в кабінеті!" })).toBeVisible();
    expect(screen.getByRole("heading", { level: 3, name: "Замовлень поки немає" })).toBeVisible();

    const categories = screen.getByRole("navigation", { name: "Категорії каталогу" });
    expect(within(categories).getByRole("link", { name: "iPhone" })).toHaveAttribute(
      "href",
      "/collections/iphone",
    );
    expect(screen.getByRole("link", { name: "Увесь каталог" })).toHaveAttribute(
      "href",
      "/collections",
    );
    expect(screen.queryByRole("navigation", { name: "Сторінки замовлень" })).toBeNull();
  });
});
