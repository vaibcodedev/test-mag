import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { OrderCard } from "./order-card";
import type { AccountOrder, OrderLineItem } from "./order-card.types";
import { itemCountLabel, orderItemsPreview, orderItemsSummary } from "./order-items";
import {
  fulfillmentStatus,
  orderStatuses,
  paymentStatus,
  orderHeadline,
  orderProgress,
} from "./order-status";

const text = (element: HTMLElement) => (element.textContent ?? "").replace(/\s/g, " ");

function lines(count: number, quantity = 1): OrderLineItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `line-${index}`,
    title: `Товар ${index + 1}`,
    quantity,
    image: index % 2 === 0 ? { url: `https://cdn.shopify.com/p-${index}.png` } : null,
  }));
}

const ORDER: AccountOrder = {
  id: "gid://shopify/Order/1",
  name: "#1001",
  processedAt: "2026-11-18T10:00:00Z",
  financialStatus: "PAID",
  fulfillmentStatus: "FULFILLED",
  statusPageUrl: "https://shop.example/orders/1",
  totalPrice: { amount: "64999.0", currencyCode: "UAH" },
  lineItemsSummary: { lineItemCount: 6, totalQuantityOfLineItems: 8 },
  lineItems: { nodes: lines(4) },
};

/** Картка має посилання на сторінку замовлення, тож їй потрібен роутер. */
function renderCard(order: AccountOrder = ORDER) {
  return render(
    <MemoryRouter initialEntries={["/account"]}>
      <OrderCard order={order} />
    </MemoryRouter>,
  );
}

describe("paymentStatus і fulfillmentStatus", () => {
  it("перекладають відомі коди", () => {
    expect(paymentStatus("PENDING")).toEqual({ label: "Очікує оплати", tone: "attention" });
    expect(paymentStatus("PAID")).toEqual({ label: "Оплачено", tone: "positive" });
    expect(paymentStatus("REFUNDED")?.label).toBe("Кошти повернено");
    expect(fulfillmentStatus("UNFULFILLED")?.label).toBe("Готуємо до відправлення");
    expect(fulfillmentStatus("FULFILLED")).toEqual({ label: "Виконано", tone: "positive" });
    expect(fulfillmentStatus("READY_FOR_PICKUP")?.label).toBe("Готове до видачі");
  });

  it("ховають невідомі коди й не плутаються з полями прототипу", () => {
    expect(paymentStatus("SOMETHING_NEW")).toBeNull();
    expect(paymentStatus("toString")).toBeNull();
    expect(paymentStatus(null)).toBeNull();
    expect(fulfillmentStatus("SOMETHING_NEW")).toBeNull();
    expect(fulfillmentStatus("constructor")).toBeNull();
    expect(fulfillmentStatus(undefined)).toBeNull();
  });

  it("покривають усі коди схеми Customer Account API", () => {
    const financial = [
      "AUTHORIZED",
      "EXPIRED",
      "PAID",
      "PARTIALLY_PAID",
      "PARTIALLY_REFUNDED",
      "PENDING",
      "REFUNDED",
      "VOIDED",
    ];
    const fulfillment = [
      "FULFILLED",
      "IN_PROGRESS",
      "ON_HOLD",
      "OPEN",
      "PARTIALLY_FULFILLED",
      "PENDING_FULFILLMENT",
      "READY_FOR_DELIVERY",
      "READY_FOR_PICKUP",
      "RESTOCKED",
      "SCHEDULED",
      "UNFULFILLED",
    ];

    for (const code of financial) expect(paymentStatus(code)?.label).toMatch(/^[А-ЯІЇЄҐ]/);
    for (const code of fulfillment) expect(fulfillmentStatus(code)?.label).toMatch(/^[А-ЯІЇЄҐ]/);
  });
});

describe("orderHeadline і шлях кроками", () => {
  it("скасування важливіше за решту станів", () => {
    expect(
      orderHeadline({
        cancelledAt: "2026-08-22T09:00:00Z",
        financialStatus: "REFUNDED",
        fulfillmentStatus: "FULFILLED",
      }),
    ).toEqual({ label: "Скасовано", tone: "attention", cancelled: true });
  });

  const states = (order: Parameters<typeof orderProgress>[0]) =>
    orderProgress(order)?.map((step) => step.state);

  it("шлях — завжди чотири етапи в одному порядку", () => {
    expect(
      orderProgress({ financialStatus: "PAID", fulfillmentStatus: "UNFULFILLED" })?.map(
        (step) => step.label,
      ),
    ).toEqual(["Оформлення", "Оплата", "Комплектування", "Відправлення"]);
  });

  it("оплата, що чекає на покупця, стає головним станом, решта етапів попереду", () => {
    const order = { financialStatus: "PENDING", fulfillmentStatus: "UNFULFILLED" };
    expect(orderHeadline(order).label).toBe("Очікує оплати");
    expect(states(order)).toEqual(["done", "current", "upcoming", "upcoming"]);
  });

  it("оплачене замовлення збирають, відправлення ще попереду", () => {
    expect(states({ financialStatus: "PAID", fulfillmentStatus: "UNFULFILLED" })).toEqual([
      "done",
      "done",
      "current",
      "upcoming",
    ]);
  });

  it("частково відправлене: зібрано, відправлення триває", () => {
    const order = { financialStatus: "PAID", fulfillmentStatus: "PARTIALLY_FULFILLED" };
    expect(orderHeadline(order).label).toBe("Відправлено частково");
    expect(states(order)).toEqual(["done", "done", "done", "current"]);
  });

  it("виконане замовлення пройшло всі етапи", () => {
    expect(states({ financialStatus: "PAID", fulfillmentStatus: "FULFILLED" })).toEqual([
      "done",
      "done",
      "done",
      "done",
    ]);
  });

  it("відправлене з оплатою при отриманні: оплата ще триває", () => {
    expect(states({ financialStatus: "PENDING", fulfillmentStatus: "FULFILLED" })).toEqual([
      "done",
      "current",
      "done",
      "done",
    ]);
  });

  it("призупинене відправлення позначено як проблему на етапі комплектування", () => {
    expect(states({ financialStatus: "PAID", fulfillmentStatus: "ON_HOLD" })).toEqual([
      "done",
      "done",
      "problem",
      "upcoming",
    ]);
  });

  it("скасоване замовлення й невідомі коди шляху не мають", () => {
    expect(
      orderProgress({
        cancelledAt: "2026-08-22T09:00:00Z",
        financialStatus: "PENDING",
        fulfillmentStatus: "UNFULFILLED",
      }),
    ).toBeNull();
    expect(orderProgress({ financialStatus: "X", fulfillmentStatus: "Y" })).toBeNull();
  });
});

describe("orderStatuses", () => {
  it("для скасованого замовлення замінює стан доставки на «Скасовано»", () => {
    expect(
      orderStatuses({
        cancelledAt: "2026-08-22T09:00:00Z",
        financialStatus: "REFUNDED",
        fulfillmentStatus: "UNFULFILLED",
      }),
    ).toEqual({
      payment: { label: "Кошти повернено", tone: "neutral" },
      delivery: { label: "Скасовано", tone: "attention" },
    });
  });

  it("невідомі коди дають null", () => {
    expect(orderStatuses({ financialStatus: "X", fulfillmentStatus: "Y" })).toEqual({
      payment: null,
      delivery: null,
    });
  });
});

describe("orderItemsPreview", () => {
  it("показує всі позиції, коли вони вміщаються в плитки", () => {
    const preview = orderItemsPreview({
      lineItems: { nodes: lines(4) },
      lineItemsSummary: { lineItemCount: 4, totalQuantityOfLineItems: 4 },
    });

    expect(preview.thumbs).toHaveLength(4);
    expect(preview.hiddenCount).toBe(0);
  });

  it("віддає останню плитку під «+N», коли позицій більше", () => {
    const preview = orderItemsPreview({
      lineItems: { nodes: lines(4) },
      lineItemsSummary: { lineItemCount: 6, totalQuantityOfLineItems: 8 },
    });

    expect(preview.thumbs.map((item) => item.title)).toEqual(["Товар 1", "Товар 2", "Товар 3"]);
    expect(preview.hiddenCount).toBe(3);
    expect(preview.lineCount).toBe(6);
    expect(preview.totalQuantity).toBe(8);
  });

  it("без підсумку з API рахує з отриманих позицій", () => {
    const preview = orderItemsPreview({ lineItems: { nodes: lines(2, 3) } });

    expect(preview).toMatchObject({ hiddenCount: 0, lineCount: 2, totalQuantity: 6 });
  });

  it("не вірить підсумку, меншому за отримані позиції", () => {
    const preview = orderItemsPreview({
      lineItems: { nodes: lines(3, 2) },
      lineItemsSummary: { lineItemCount: 1, totalQuantityOfLineItems: 1 },
    });

    expect(preview).toMatchObject({ hiddenCount: 0, lineCount: 3, totalQuantity: 6 });
  });

  it("порожнє замовлення не дає плиток", () => {
    expect(orderItemsPreview({})).toEqual({
      thumbs: [],
      hiddenCount: 0,
      lineCount: 0,
      totalQuantity: 0,
    });
  });
});

describe("підписи складу замовлення", () => {
  it.each([
    [1, "1 товар"],
    [3, "3 товари"],
    [8, "8 товарів"],
    [21, "21 товар"],
  ])("itemCountLabel(%i) → %s", (count, expected) => {
    expect(itemCountLabel(count)).toBe(expected);
  });

  it("називає першу позицію і скільки є ще", () => {
    expect(orderItemsSummary(orderItemsPreview({ lineItems: { nodes: lines(1) } }))).toBe(
      "Товар 1",
    );
    expect(orderItemsSummary(orderItemsPreview(ORDER))).toBe("Товар 1 та ще 5 товарів");
    expect(orderItemsSummary(orderItemsPreview({}))).toBeNull();
  });
});

describe("OrderCard", () => {
  it("показує номер, дату, кількість, суму, обидва стани й посилання на сторінку стану", () => {
    renderCard();

    const card = screen.getByRole("article", { name: "Замовлення #1001" });
    expect(within(card).getByRole("heading", { level: 3 })).toHaveTextContent("Замовлення #1001");
    expect(within(card).getByText("18 листопада 2026 р.")).toHaveAttribute(
      "datetime",
      "2026-11-18",
    );
    expect(text(card)).toContain("8 товарів");
    expect(text(card)).toContain("64 999 ₴");

    // Стан — рядком у шапці; нижче повний шлях, у виконаного замовлення всі етапи пройдено.
    expect(text(card.querySelector('[data-slot="order-headline"]')!)).toBe("Стан: Виконано");
    const path = within(card).getByRole("list", { name: "Стан замовлення" });
    expect(within(path).getAllByRole("listitem").map(text)).toEqual([
      "Оформлення: пройдено",
      "Оплата: пройдено",
      "Комплектування: пройдено",
      "Відправлення: пройдено",
    ]);
    // Оплату окремо біля суми не дублюємо: вона є етапом шляху.
    expect(card.querySelector('[data-slot="order-payment"]')).toBeNull();

    expect(within(card).getByRole("link", { name: "Стан замовлення #1001" })).toHaveAttribute(
      "href",
      "https://shop.example/orders/1",
    );
  });

  it("малює три мініатюри й плитку «+3», позицію без фото — плиткою без зображення", () => {
    const { container } = renderCard();

    const thumbs = container.querySelector('[data-slot="order-thumbs"]') as HTMLElement;
    expect(thumbs).toHaveAttribute("aria-hidden", "true");
    expect(thumbs.querySelectorAll('[data-slot="item-media"]')).toHaveLength(4);
    expect(thumbs.querySelectorAll("img")).toHaveLength(2);
    expect(thumbs.querySelector('[data-thumb="more"]')).toHaveTextContent("+3");
    expect(screen.getByText("Товар 1 та ще 5 товарів")).toBeInTheDocument();
  });

  it("невідомі коди станів не потрапляють на сторінку, замовлення без позицій не ламається", () => {
    const { container } = renderCard({
      ...ORDER,
      financialStatus: "SOMETHING_NEW",
      fulfillmentStatus: "ANOTHER_ONE",
      lineItems: null,
      lineItemsSummary: null,
    });

    expect(screen.queryByRole("list", { name: "Стан замовлення" })).toBeNull();
    expect(container).not.toHaveTextContent(/SOMETHING_NEW|ANOTHER_ONE/);
    expect(container.querySelector('[data-slot="order-thumbs"]')).toBeNull();
    expect(screen.getByRole("link", { name: "Стан замовлення #1001" })).toBeInTheDocument();
    // Порожнє замовлення нічого не додасть у кошик, тож і кнопки немає.
    expect(screen.queryByRole("button", { name: /Повторити/ })).toBeNull();
  });

  it("веде на сторінку замовлення в кабінеті й пропонує повторити замовлення", () => {
    renderCard();

    const details = screen.getByRole("link", { name: "Деталі замовлення #1001" });
    expect(details).toHaveAttribute("href", "/account/orders/1");
    expect(screen.getByRole("button", { name: "Повторити замовлення #1001" })).toHaveTextContent(
      "Повторити",
    );
  });

  it("без зрозумілого ідентифікатора лишає тільки сторінку стану в Shopify", () => {
    renderCard({ ...ORDER, id: "gid://shopify/Order/1?key=abc" });

    expect(screen.queryByRole("link", { name: /Деталі/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Повторити/ })).toBeNull();
    expect(screen.getByRole("link", { name: "Стан замовлення #1001" })).toBeInTheDocument();
  });
});
