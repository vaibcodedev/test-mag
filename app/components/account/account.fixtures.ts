import type { AccountCustomer } from "~/components/account/account-view";
import type { AccountOrder, OrderLineItem } from "~/components/account/order-card";
import type {
  OrderAdjustments,
  OrderDetailsData,
  OrderDetailsLine,
  OrderShipment,
} from "~/components/account/order-details";
import type { ProfileData } from "~/components/account/profile-view";
import { demoImage, uah } from "~/components/home/home.fixtures";
import type { ReorderOutcome } from "~/lib/account/reorder";

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

/* ── Сторінка замовлення ─────────────────────────────────────────────────── */

function detailsLine(
  id: number,
  title: string,
  imageIndex: number | null,
  price: number,
  quantity = 1,
  options: { variantTitle?: string; discount?: number } = {},
): OrderDetailsLine {
  return {
    id: `gid://shopify/LineItem/${id}`,
    title,
    variantTitle: options.variantTitle ?? "Default Title",
    quantity,
    image: imageIndex === null ? null : demoImage(imageIndex),
    price: uah(price),
    totalPrice: uah(price * quantity),
    totalDiscount: uah(options.discount ?? 0),
  };
}

const DEMO_ADDRESS = {
  name: "Олена Коваль",
  address1: "вул. Соборна, 12",
  address2: "кв. 5",
  city: "Вінниця",
  zip: "21050",
  province: "Вінницька область",
  country: "Ukraine",
  phoneNumber: "+380671234567",
};

/** Багато позицій: знижка на позицію, позиція без фото, довга назва, кілька штук. */
export const DEMO_ORDER_DETAILS: OrderDetailsData = {
  id: "gid://shopify/Order/1005",
  name: "#1005",
  processedAt: "2026-10-28T10:05:00+02:00",
  financialStatus: "PAID",
  fulfillmentStatus: "PARTIALLY_FULFILLED",
  statusPageUrl: "https://example.com/orders/1005",
  subtotal: uah(92892),
  totalShipping: uah(0),
  totalTax: uah(0),
  totalPrice: uah(92892),
  shippingAddress: DEMO_ADDRESS,
  lineItems: {
    nodes: [
      detailsLine(51, "MacBook Air 13 M4", 1, 54499, 1, {
        variantTitle: "16/256 ГБ / темна ніч",
        discount: 4500,
      }),
      detailsLine(52, "Apple Watch Series 11", 2, 21999, 1, { variantTitle: "46 мм / чорний" }),
      detailsLine(53, "AirPods Pro 3 з MagSafe", 3, 11999),
      detailsLine(54, "Чохол MagSafe для iPhone 17 Pro", 4, 2399, 2, {
        variantTitle: "Синій титан",
      }),
      detailsLine(
        55,
        "Захисне скло з олеофобним покриттям і рамкою для точного наклеювання для iPhone 17 Pro Max, комплект із двох штук",
        null,
        1299,
        2,
      ),
      detailsLine(56, "Кабель USB-C — USB-C 240 Вт, 2 м, плетений", 4, 1499),
    ],
    pageInfo: { hasNextPage: false },
  },
};

/** Промокод сумою, знижка на доставку відсотком і безкоштовна доставка. */
export const DEMO_ORDER_ADJUSTMENTS: OrderAdjustments = {
  cancelReason: null,
  totalRefunded: uah(0),
  shippingLine: { title: "Нова пошта, відділення" },
  discountApplications: {
    nodes: [
      {
        targetType: "LINE_ITEM",
        code: "WELCOME",
        value: { __typename: "MoneyV2", amount: "4500.0", currencyCode: "UAH" },
      },
      {
        targetType: "SHIPPING_LINE",
        title: "Від 50 000 ₴",
        value: { __typename: "PricingPercentageValue", percentage: 100 },
      },
    ],
  },
  refunds: [],
};

/** Два відправлення: одне доставлено, друге в дорозі з двома номерами. */
export const DEMO_ORDER_SHIPMENTS: OrderShipment[] = [
  {
    id: "gid://shopify/Fulfillment/1",
    createdAt: "2026-10-29T12:00:00+02:00",
    latestShipmentStatus: "DELIVERED",
    status: "SUCCESS",
    trackingInformation: [
      {
        company: "Нова пошта",
        number: "59001234567890",
        url: "https://novaposhta.ua/tracking/?cargo_number=59001234567890",
      },
    ],
    fulfillmentLineItems: {
      nodes: [
        {
          id: "gid://shopify/FulfillmentLineItem/1",
          quantity: 1,
          lineItem: { id: "gid://shopify/LineItem/51", title: "MacBook Air 13 M4" },
        },
        {
          id: "gid://shopify/FulfillmentLineItem/2",
          quantity: 1,
          lineItem: { id: "gid://shopify/LineItem/52", title: "Apple Watch Series 11" },
        },
      ],
    },
  },
  {
    id: "gid://shopify/Fulfillment/2",
    createdAt: "2026-10-31T09:30:00+02:00",
    estimatedDeliveryAt: "2026-11-03T12:00:00+02:00",
    latestShipmentStatus: "IN_TRANSIT",
    status: "SUCCESS",
    trackingInformation: [
      { company: "Нова пошта", number: "59001234567891", url: null },
      { company: null, number: "59001234567892", url: null },
    ],
    fulfillmentLineItems: {
      nodes: [
        {
          id: "gid://shopify/FulfillmentLineItem/3",
          quantity: 2,
          lineItem: { id: "gid://shopify/LineItem/54", title: "Чохол MagSafe для iPhone 17 Pro" },
        },
      ],
    },
  },
];

/** Відправлення без номера для відстеження й з кодом стану, якого сайт не знає. */
export const DEMO_ORDER_SHIPMENT_WITHOUT_TRACKING: OrderShipment[] = [
  {
    id: "gid://shopify/Fulfillment/3",
    createdAt: "2026-11-13T10:00:00+02:00",
    latestShipmentStatus: "SOMETHING_NEW",
    status: "SUCCESS",
    trackingInformation: [],
    fulfillmentLineItems: { nodes: [] },
  },
];

/** Одна позиція, платна доставка, оплату ще не отримано. */
export const DEMO_ORDER_SINGLE: OrderDetailsData = {
  id: "gid://shopify/Order/1006",
  name: "#1006",
  processedAt: "2026-11-12T14:20:00+02:00",
  financialStatus: "PENDING",
  fulfillmentStatus: "UNFULFILLED",
  statusPageUrl: "https://example.com/orders/1006",
  subtotal: uah(119999),
  totalShipping: uah(150),
  totalTax: uah(0),
  totalPrice: uah(120149),
  shippingAddress: DEMO_ADDRESS,
  lineItems: {
    nodes: [
      detailsLine(61, "iPhone 17 Pro Max", 0, 119999, 1, { variantTitle: "512 ГБ / синій титан" }),
    ],
  },
};

export const DEMO_ORDER_SINGLE_ADJUSTMENTS: OrderAdjustments = {
  shippingLine: { title: "Кур'єр за адресою" },
  totalRefunded: uah(0),
  discountApplications: { nodes: [] },
  refunds: [],
};

/** Скасоване замовлення з поверненням коштів двома частинами. */
export const DEMO_ORDER_REFUNDED: OrderDetailsData = {
  id: "gid://shopify/Order/1002",
  name: "#1002",
  processedAt: "2026-08-21T12:00:00+03:00",
  cancelledAt: "2026-08-22T09:00:00+03:00",
  financialStatus: "REFUNDED",
  fulfillmentStatus: "UNFULFILLED",
  statusPageUrl: "https://example.com/orders/1002",
  subtotal: uah(64999),
  totalShipping: uah(0),
  totalTax: uah(0),
  totalPrice: uah(64999),
  shippingAddress: null,
  lineItems: {
    nodes: [
      detailsLine(21, "iPhone 17 Pro", 0, 64999, 1, { variantTitle: "256 ГБ / синій титан" }),
    ],
  },
};

export const DEMO_ORDER_REFUNDED_ADJUSTMENTS: OrderAdjustments = {
  cancelReason: "CUSTOMER",
  totalRefunded: uah(64999),
  shippingLine: null,
  discountApplications: { nodes: [] },
  refunds: [
    {
      id: "gid://shopify/Refund/1",
      createdAt: "2026-08-22T09:05:00+03:00",
      returnName: null,
      totalRefunded: uah(60000),
    },
    {
      id: "gid://shopify/Refund/2",
      createdAt: "2026-08-25T15:40:00+03:00",
      returnName: "#1002-R1",
      totalRefunded: uah(4999),
    },
  ],
};

/* ── Повторення замовлення ───────────────────────────────────────────────── */

export const DEMO_REORDER_PARTIAL: ReorderOutcome = {
  openCart: true,
  message: {
    tone: "warning",
    title: "Додано не все",
    description:
      "Закінчився: «Apple Watch Series 11 (46 мм / чорний)». Більше не продається: «Кабель USB-C — USB-C 240 Вт, 2 м, плетений». Решта вже в кошику.",
  },
};

export const DEMO_REORDER_FAILED: ReorderOutcome = {
  openCart: false,
  message: {
    tone: "error",
    title: "Нічого не додано",
    description:
      "Жодного товару з цього замовлення зараз не купити. Закінчився: «iPhone 17 Pro (256 ГБ / синій титан)».",
  },
};

/* ── Профіль ─────────────────────────────────────────────────────────────── */

export const DEMO_PROFILE: ProfileData = {
  firstName: "Олена",
  lastName: "Коваль",
  email: "olena.koval@example.com",
  phone: { status: "editable", value: "+380671234567" },
  marketing: "subscribed",
};

/** Новий покупець: без імені, без адреси доставки (телефон зберегти нікуди), без підписки. */
export const DEMO_PROFILE_NEW: ProfileData = {
  firstName: null,
  lastName: null,
  email: "very.long.customer.address.for.wrapping@example-company.com.ua",
  phone: { status: "no-address" },
  marketing: "unsubscribed",
};
