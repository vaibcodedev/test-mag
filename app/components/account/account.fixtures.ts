import type { AccountCustomer } from "~/components/account/account-view";
import type { AccountOrder, OrderLineItem } from "~/components/account/order-card";
import { demoImage, uah } from "~/components/home/home.fixtures";

/** Демо-дані кабінету для історій Storybook і тестів. */

function line(id: number, title: string, imageIndex: number | null, quantity = 1): OrderLineItem {
  return {
    id: `gid://shopify/LineItem/${id}`,
    title,
    quantity,
    image: imageIndex === null ? null : demoImage(imageIndex),
  };
}

function summary(lineItemCount: number, totalQuantityOfLineItems: number) {
  return { lineItemCount, totalQuantityOfLineItems };
}

export const DEMO_ORDERS: AccountOrder[] = [
  {
    id: "gid://shopify/Order/1006",
    name: "#1006",
    processedAt: "2026-11-12T14:20:00+02:00",
    financialStatus: "PENDING",
    fulfillmentStatus: "UNFULFILLED",
    statusPageUrl: "https://example.com/orders/1006",
    totalPrice: uah(119999),
    lineItemsSummary: summary(1, 1),
    lineItems: { nodes: [line(61, "iPhone 17 Pro Max 512 ГБ, синій титан", 0)] },
  },
  {
    // Позицій більше, ніж плиток: остання плитка — «+3».
    id: "gid://shopify/Order/1005",
    name: "#1005",
    processedAt: "2026-10-28T10:05:00+02:00",
    financialStatus: "PAID",
    fulfillmentStatus: "PARTIALLY_FULFILLED",
    statusPageUrl: "https://example.com/orders/1005",
    totalPrice: uah(96396),
    lineItemsSummary: summary(6, 8),
    lineItems: {
      nodes: [
        line(51, "MacBook Air 13 M4 16/256 ГБ, темна ніч", 1),
        line(52, "Apple Watch Series 11 46 мм, чорний", 2),
        line(53, "AirPods Pro 3 з MagSafe", 3),
        line(54, "Чохол MagSafe для iPhone 17 Pro", 4, 2),
      ],
    },
  },
  {
    // Довга назва й позиція без фото.
    id: "gid://shopify/Order/1004",
    name: "#1004",
    processedAt: "2026-10-03T18:40:00+03:00",
    financialStatus: "PAID",
    fulfillmentStatus: "FULFILLED",
    statusPageUrl: "https://example.com/orders/1004",
    totalPrice: uah(8497),
    lineItemsSummary: summary(2, 3),
    lineItems: {
      nodes: [
        line(
          41,
          "Захисне скло з олеофобним покриттям і рамкою для точного наклеювання для iPhone 17 Pro Max, комплект із двох штук",
          null,
          2,
        ),
        line(42, "Кабель USB-C — USB-C 240 Вт, 2 м, плетений", 4),
      ],
    },
  },
  {
    id: "gid://shopify/Order/1003",
    name: "#1003",
    processedAt: "2026-09-14T09:15:00+03:00",
    financialStatus: "PAID",
    fulfillmentStatus: "READY_FOR_PICKUP",
    statusPageUrl: "https://example.com/orders/1003",
    totalPrice: uah(21999),
    lineItemsSummary: summary(1, 1),
    lineItems: { nodes: [line(31, "Apple Watch Series 11 46 мм, чорний", 2)] },
  },
  {
    id: "gid://shopify/Order/1002",
    name: "#1002",
    processedAt: "2026-08-21T12:00:00+03:00",
    cancelledAt: "2026-08-22T09:00:00+03:00",
    financialStatus: "REFUNDED",
    fulfillmentStatus: "UNFULFILLED",
    statusPageUrl: "https://example.com/orders/1002",
    totalPrice: uah(64999),
    lineItemsSummary: summary(1, 1),
    lineItems: { nodes: [line(21, "iPhone 17 Pro 256 ГБ, синій титан", 0)] },
  },
  {
    // Код стану, якого сайт ще не знає, і замовлення без позицій: картка не ламається.
    id: "gid://shopify/Order/1001",
    name: "#1001",
    processedAt: "2026-07-02T16:30:00+03:00",
    financialStatus: "SOMETHING_NEW",
    fulfillmentStatus: "ON_HOLD",
    statusPageUrl: "https://example.com/orders/1001",
    totalPrice: uah(2399),
  },
];

export const DEMO_CUSTOMER: AccountCustomer = {
  firstName: "Олена",
  lastName: "Коваль",
  emailAddress: { emailAddress: "olena.koval@example.com" },
  orders: {
    nodes: DEMO_ORDERS,
    pageInfo: { hasNextPage: true, hasPreviousPage: false, startCursor: "a", endCursor: "b" },
  },
};

export const DEMO_CUSTOMER_WITHOUT_ORDERS: AccountCustomer = {
  ...DEMO_CUSTOMER,
  orders: { nodes: [], pageInfo: { hasNextPage: false, hasPreviousPage: false } },
};

/** Покупець, який увійшов за кодом з пошти й ще не вказав імені. */
export const DEMO_CUSTOMER_WITHOUT_NAME: AccountCustomer = {
  ...DEMO_CUSTOMER,
  firstName: null,
  lastName: null,
  emailAddress: { emailAddress: "very.long.customer.address.for.wrapping@example-company.com.ua" },
};
