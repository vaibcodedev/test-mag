import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import {
  DEMO_ORDER_ADJUSTMENTS,
  DEMO_ORDER_DETAILS,
  DEMO_ORDER_REFUNDED,
  DEMO_ORDER_REFUNDED_ADJUSTMENTS,
  DEMO_ORDER_SHIPMENT_WITHOUT_TRACKING,
  DEMO_ORDER_SHIPMENTS,
  DEMO_ORDER_SINGLE,
  DEMO_REORDER_FAILED,
  DEMO_REORDER_PARTIAL,
} from "~/components/account/account.fixtures";
import { STORE_INFO } from "~/lib/content/site";

import { OrderDetails, type OrderDetailsProps } from "./order-details";

const text = (element: Element | null) => (element?.textContent ?? "").replace(/\s/g, " ");

function renderDetails(props: Partial<OrderDetailsProps> = {}) {
  return render(
    <MemoryRouter initialEntries={["/account/orders/1005"]}>
      <OrderDetails
        order={DEMO_ORDER_DETAILS}
        adjustments={DEMO_ORDER_ADJUSTMENTS}
        shipments={DEMO_ORDER_SHIPMENTS}
        store={STORE_INFO}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("OrderDetails", () => {
  it("має один h1, не пропускає рівнів заголовків і веде назад у кабінет", () => {
    renderDetails();

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Замовлення #1005" })).toBeVisible();
    const levels = screen.getAllByRole("heading").map((heading) => Number(heading.tagName[1]));
    levels.forEach((level, index) => {
      if (index > 0) expect(level - (levels[index - 1] as number)).toBeLessThanOrEqual(1);
    });

    const crumbs = screen.getByRole("navigation", { name: "Навігаційний ланцюжок" });
    expect(within(crumbs).getByRole("link", { name: "Кабінет" })).toHaveAttribute(
      "href",
      "/account",
    );
  });

  it("показує дату, стани тими самими словами, що й картка, і кількість товарів", () => {
    renderDetails();

    expect(screen.getByText("28 жовтня 2026 р.")).toHaveAttribute("datetime", "2026-10-28");
    const statuses = screen.getByRole("list", { name: "Стан замовлення" });
    expect(within(statuses).getAllByRole("listitem").map(text)).toEqual([
      "Оплата: Оплачено",
      "Доставка: Відправлено частково",
    ]);
    expect(text(document.body)).toContain("8 товарів");
  });

  it("кожна позиція: назва, варіант, кількість із ціною за одиницю, сума й знижка", () => {
    const { container } = renderDetails();

    const lines = [...container.querySelectorAll('[data-slot="order-line"]')];
    expect(lines).toHaveLength(6);
    expect(text(lines[0] ?? null)).toContain("MacBook Air 13 M4");
    expect(text(lines[0] ?? null)).toContain("16/256 ГБ / темна ніч");
    expect(text(lines[0] ?? null)).toContain("1 шт. ×  по 54 499 ₴");
    expect(text(lines[0] ?? null)).toContain("Сума: 54 499 ₴");
    expect(text(lines[0] ?? null)).toContain("Знижка −4 500 ₴");
    // Службовий «Default Title» і нульову знижку не показуємо.
    expect(text(lines[2] ?? null)).not.toMatch(/Default Title|Знижка/);
    expect(text(lines[3] ?? null)).toContain("2 шт. ×  по 2 399 ₴");
    expect(text(lines[3] ?? null)).toContain("Сума: 4 798 ₴");
    // Позиція без фото — плитка з іконкою.
    expect(lines[4]?.querySelector("img")).toBeNull();
    expect(lines[0]?.querySelector("img")).not.toBeNull();
  });

  it("розрахунок: товари, знижки, безкоштовна доставка, разом — без нульових рядків", () => {
    const { container } = renderDetails();

    const rows = [...container.querySelectorAll('[data-slot="order-totals"] [data-row]')];
    expect(rows.map((row) => row.getAttribute("data-row"))).toEqual([
      "subtotal",
      "discount-0",
      "discount-1",
      "shipping",
      "total",
    ]);
    expect(text(rows[1] ?? null)).toBe("Знижка «WELCOME»−4 500 ₴");
    expect(text(rows[3] ?? null)).toBe("ДоставкаБезкоштовно");
    expect(text(rows[4] ?? null)).toBe("Разом92 892 ₴");
  });

  it("спосіб доставки, адреса без «Ukraine» і телефон одержувача", () => {
    renderDetails();

    const receiving = screen.getByRole("region", { name: "Отримання" });
    expect(within(receiving).getByText("Нова пошта, відділення")).toBeInTheDocument();
    expect(within(receiving).getByText("вул. Соборна, 12, кв. 5")).toBeInTheDocument();
    expect(within(receiving).getByText("21050 Вінниця")).toBeInTheDocument();
    expect(within(receiving).queryByText("Ukraine")).toBeNull();
    expect(within(receiving).getByText("+380 67 123 45 67")).toBeInTheDocument();
  });

  it("кілька відправлень: стан, перевізник, номер і посилання лише там, де воно є", () => {
    const { container } = renderDetails();

    const shipments = [...container.querySelectorAll('[data-slot="order-shipment"]')];
    expect(shipments).toHaveLength(2);
    const [first, second] = shipments as [HTMLElement, HTMLElement];

    expect(within(first).getByRole("heading", { level: 3 })).toHaveTextContent(
      "Відправлення 1 з 2",
    );
    expect(text(first)).toContain("Стан: Доставлено");
    expect(text(first)).toContain("Нова пошта");
    expect(text(first)).toContain("59001234567890");
    const track = within(first).getByRole("link", { name: /Відстежити/ });
    expect(track).toHaveAttribute(
      "href",
      "https://novaposhta.ua/tracking/?cargo_number=59001234567890",
    );
    expect(track).toHaveAttribute("target", "_blank");
    expect(track).toHaveAttribute("rel", "noopener noreferrer");
    expect(text(first)).toContain("У посилці: MacBook Air 13 M4; Apple Watch Series 11");

    expect(text(second)).toContain("Стан: У дорозі");
    expect(text(second)).toContain(
      "Відправлено 31 жовтня 2026 р. · Очікуємо доставку 3 листопада 2026 р.",
    );
    expect(text(second)).toContain("59001234567891");
    expect(text(second)).toContain("59001234567892");
    expect(within(second).queryByRole("link")).toBeNull();
    expect(text(second)).toContain("Чохол MagSafe для iPhone 17 Pro × 2");
  });

  it("відправлення без номера каже про це, а невідомий код події не показує", () => {
    const { container } = renderDetails({
      order: DEMO_ORDER_SINGLE,
      shipments: DEMO_ORDER_SHIPMENT_WITHOUT_TRACKING,
    });

    const shipment = container.querySelector('[data-slot="order-shipment"]');
    expect(text(shipment)).toContain("Номера для відстеження ще немає.");
    expect(text(shipment)).toContain("Стан: Відправлено");
    expect(container).not.toHaveTextContent(/SOMETHING_NEW|SUCCESS/);
  });

  it("скасоване замовлення: дата, зрозуміла причина й повернення коштів", () => {
    const { container } = renderDetails({
      order: DEMO_ORDER_REFUNDED,
      adjustments: DEMO_ORDER_REFUNDED_ADJUSTMENTS,
      shipments: [],
    });

    const cancelled = container.querySelector('[data-slot="order-cancelled"]');
    expect(text(cancelled)).toContain("Замовлення скасовано 22 серпня 2026 р.");
    expect(text(cancelled)).toContain("Причина: на ваше прохання.");
    expect(container).not.toHaveTextContent("CUSTOMER");

    const refunds = screen.getByRole("region", { name: "Повернення коштів" });
    expect(within(refunds).getAllByRole("listitem").map(text)).toEqual([
      "22 серпня 2026 р.60 000 ₴",
      "25 серпня 2026 р.За поверненням #1002-R14 999 ₴",
    ]);
    expect(text(container.querySelector('[data-row="refunded"]'))).toBe("Повернено−64 999 ₴");
    expect(screen.queryByRole("region", { name: "Отримання" })).toBeNull();
    expect(screen.queryByRole("region", { name: /Відправлення|Доставка посилки/ })).toBeNull();
  });

  it("без другорядних даних лишає товари, суму й дії", () => {
    const { container } = renderDetails({ adjustments: null, shipments: null });

    expect(container.querySelectorAll('[data-slot="order-line"]')).toHaveLength(6);
    expect(
      [...container.querySelectorAll("[data-row]")].map((row) => row.getAttribute("data-row")),
    ).toEqual(["subtotal", "total"]);
    expect(screen.queryByRole("region", { name: "Повернення коштів" })).toBeNull();
    // Адреса приходить з основним запитом, тож блок отримання лишається.
    expect(screen.getByRole("region", { name: "Отримання" })).toBeInTheDocument();
  });

  it("дії: повторити замовлення й друга дія — сторінка стану в Shopify", () => {
    renderDetails();

    expect(screen.getByRole("button", { name: "Повторити замовлення #1005" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Відстеження й повернення" })).toHaveAttribute(
      "href",
      "https://example.com/orders/1005",
    );
  });

  it("під час повторення кнопка зайнята, а підсумок лишається на сторінці", () => {
    const { rerender } = renderDetails({ reorderState: { pending: true, outcome: null } });

    const button = screen.getByRole("button", { name: /Додаємо товари замовлення #1005/ });
    expect(button).toHaveAttribute("aria-busy", "true");

    rerender(
      <MemoryRouter>
        <OrderDetails
          order={DEMO_ORDER_DETAILS}
          store={STORE_INFO}
          reorderState={{ pending: false, outcome: DEMO_REORDER_PARTIAL }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Додано не все");
    expect(screen.getByRole("status")).toHaveTextContent("Закінчився: «Apple Watch Series 11");

    rerender(
      <MemoryRouter>
        <OrderDetails
          order={DEMO_ORDER_DETAILS}
          store={STORE_INFO}
          reorderState={{ pending: false, outcome: DEMO_REORDER_FAILED }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Нічого не додано");
  });
});
