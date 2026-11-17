/**
 * Демо-замовлення для перевірки особистого кабінету.
 *
 *   npm run seed:orders -- buyer@example.com   — створити замовлення для цього покупця
 *   npm run seed:orders -- --delete            — видалити всі створені цим скриптом
 *
 * Замовлення тестові (`test: true`), без справжньої оплати; листів покупцеві Shopify
 * не надсилає, залишки на складі не змінюються. Кожне має тег `seed-demo`: за ним скрипт
 * знаходить свої замовлення, тож повторний запуск їх не дублює, а `--delete` прибирає.
 *
 * Застосунку потрібні дозволи `write_orders` і `read_customers` (Dev Dashboard → Versions)
 * та доступ до захищених даних клієнтів (Protected customer data), інакше Shopify не дасть
 * прив'язати замовлення до покупця.
 */
import { readFileSync } from "node:fs";

const TAG = "seed-demo";
const API_VERSION = "2026-10";

type Money = { amount: string; currencyCode: string };
type UserError = { field?: string[] | null; message: string };

function readEnv(): Record<string, string> {
  return Object.fromEntries(
    readFileSync(".env", "utf8")
      .split(/\r?\n/)
      .filter((line) => line.includes("=") && !line.trimStart().startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [
          line.slice(0, index).trim(),
          line
            .slice(index + 1)
            .trim()
            .replace(/^"|"$/g, ""),
        ];
      }),
  );
}

const env = readEnv();
const domain = env.SHOPIFY_ADMIN_DOMAIN;
if (!domain || !env.SHOPIFY_ADMIN_CLIENT_ID || !env.SHOPIFY_ADMIN_CLIENT_SECRET) {
  throw new Error(
    "У .env потрібні SHOPIFY_ADMIN_DOMAIN, SHOPIFY_ADMIN_CLIENT_ID і SHOPIFY_ADMIN_CLIENT_SECRET.",
  );
}

async function accessToken(): Promise<string> {
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.SHOPIFY_ADMIN_CLIENT_ID ?? "",
      client_secret: env.SHOPIFY_ADMIN_CLIENT_SECRET ?? "",
    }),
  });
  const body = (await response.json()) as { access_token?: string; scope?: string };
  if (!response.ok || !body.access_token)
    throw new Error(`Не вдалося отримати токен: HTTP ${response.status}`);
  for (const scope of ["write_orders"]) {
    if (!(body.scope ?? "").split(",").includes(scope)) {
      throw new Error(
        `Застосунку бракує дозволу ${scope}. Додайте його в Dev Dashboard → Versions.`,
      );
    }
  }
  return body.access_token;
}

const token = await accessToken();

async function admin<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "content-type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await response.json()) as { data?: T; errors?: { message: string }[] };
  if (body.errors?.length) throw new Error(body.errors.map((error) => error.message).join("; "));
  if (!body.data) throw new Error(`Порожня відповідь Admin API (HTTP ${response.status}).`);
  return body.data;
}

function assertNoUserErrors(action: string, errors: readonly UserError[]) {
  if (errors.length > 0) {
    throw new Error(
      `${action}: ${errors.map((error) => `${error.field?.join(".") ?? "-"}: ${error.message}`).join("; ")}`,
    );
  }
}

/* ── Наявні демо-замовлення ───────────────────────────────────────────── */

async function demoOrders(): Promise<
  { id: string; name: string; sourceIdentifier: string | null }[]
> {
  const data = await admin<{
    orders: { nodes: { id: string; name: string; sourceIdentifier: string | null }[] };
  }>(`{ orders(first: 100, query: "tag:${TAG}") { nodes { id name sourceIdentifier } } }`);
  return data.orders.nodes;
}

async function deleteDemoOrders() {
  const orders = await demoOrders();
  for (const order of orders) {
    const result = await admin<{ orderDelete: { userErrors: UserError[] } }>(
      `mutation ($orderId: ID!) { orderDelete(orderId: $orderId) { userErrors { field message } } }`,
      { orderId: order.id },
    );
    assertNoUserErrors(`Видалення ${order.name}`, result.orderDelete.userErrors);
    console.log(`Видалено ${order.name}`);
  }
  console.log(`Готово. Видалено замовлень: ${orders.length}.`);
}

/* ── Опис демо-замовлень ──────────────────────────────────────────────── */

type Line = { handle: string; quantity: number };
type DemoOrder = {
  /** Сталий ідентифікатор: за ним повторний запуск бачить, що замовлення вже є. */
  key: string;
  daysAgo: number;
  lines: Line[];
  financialStatus: "PAID" | "PENDING" | "REFUNDED";
  fulfillmentStatus?: "FULFILLED" | "PARTIAL";
  /** Номер накладної: з ним замовлення отримує відправлення зі статусом доставки. */
  tracking?: { number: string; shipmentStatus: "DELIVERED" | "IN_TRANSIT" };
  shipping: { title: string; price: number };
  cancel?: boolean;
};

const ORDERS: DemoOrder[] = [
  {
    key: "delivered-iphone",
    daysAgo: 96,
    lines: [{ handle: "iphone-17-pro", quantity: 1 }],
    financialStatus: "PAID",
    fulfillmentStatus: "FULFILLED",
    tracking: { number: "59001234567890", shipmentStatus: "DELIVERED" },
    shipping: { title: "Нова пошта, відділення", price: 0 },
  },
  {
    key: "cancelled-watch",
    daysAgo: 71,
    lines: [{ handle: "apple-watch-series-11", quantity: 1 }],
    financialStatus: "REFUNDED",
    shipping: { title: "Нова пошта, відділення", price: 0 },
    cancel: true,
  },
  {
    key: "big-order",
    daysAgo: 44,
    lines: [
      { handle: "macbook-air-13-m4", quantity: 1 },
      { handle: "magic-mouse", quantity: 1 },
      { handle: "usb-c-power-adapter-30w", quantity: 1 },
      { handle: "usb-c-charge-cable-60w", quantity: 2 },
      { handle: "macbook-sleeve-13", quantity: 1 },
      { handle: "airtag", quantity: 2 },
    ],
    financialStatus: "PAID",
    fulfillmentStatus: "FULFILLED",
    tracking: { number: "59001234567891", shipmentStatus: "DELIVERED" },
    shipping: { title: "Кур'єр по Вінниці", price: 150 },
  },
  {
    key: "partial-accessories",
    daysAgo: 19,
    lines: [
      { handle: "airpods-pro-3", quantity: 1 },
      { handle: "magsafe-charger", quantity: 1 },
      { handle: "airpods-pro-silicone-case", quantity: 1 },
    ],
    financialStatus: "PAID",
    fulfillmentStatus: "PARTIAL",
    shipping: { title: "Нова пошта, відділення", price: 99 },
  },
  {
    key: "paid-ipad",
    daysAgo: 6,
    lines: [
      { handle: "ipad-air-11-m3", quantity: 1 },
      { handle: "apple-pencil-pro", quantity: 1 },
    ],
    financialStatus: "PAID",
    shipping: { title: "Самовивіз із шоуруму", price: 0 },
  },
  {
    key: "pending-airpods",
    daysAgo: 1,
    lines: [{ handle: "airpods-4", quantity: 1 }],
    financialStatus: "PENDING",
    shipping: { title: "Нова пошта, відділення", price: 99 },
  },
];

/* ── Створення ────────────────────────────────────────────────────────── */

type Variant = {
  id: string;
  price: string;
  title: string;
  /** Склад, де цей варіант є на залишку: відправлення можна створити лише з нього. */
  inventoryItem: { inventoryLevels: { nodes: { location: { id: string } }[] } };
};

async function firstVariant(handle: string): Promise<Variant> {
  const data = await admin<{
    productByIdentifier: { variants: { nodes: Variant[] } } | null;
  }>(
    `query ($handle: String!) {
      productByIdentifier(identifier: { handle: $handle }) {
        variants(first: 1) {
          nodes {
            id
            price
            title
            inventoryItem { inventoryLevels(first: 5) { nodes { location { id } } } }
          }
        }
      }
    }`,
    { handle },
  );
  const variant = data.productByIdentifier?.variants.nodes[0];
  if (!variant)
    throw new Error(`Товару ${handle} у магазині немає: спершу запустіть npm run seed.`);
  return variant;
}

async function createOrders(email: string) {
  const [existing, shop] = await Promise.all([
    demoOrders(),
    admin<{ shop: { currencyCode: string } }>(`{ shop { currencyCode } }`),
  ]);
  const currencyCode = shop.shop.currencyCode;
  const money = (amount: number): { shopMoney: Money } => ({
    shopMoney: { amount: amount.toFixed(2), currencyCode },
  });
  const known = new Set(existing.map((order) => order.sourceIdentifier));

  let created = 0;
  for (const demo of ORDERS) {
    const sourceIdentifier = `${TAG}:${demo.key}`;
    if (known.has(sourceIdentifier)) {
      console.log(`Уже є: ${demo.key}`);
      continue;
    }

    const variants = await Promise.all(demo.lines.map((line) => firstVariant(line.handle)));
    const itemsTotal = demo.lines.reduce(
      (sum, line, index) => sum + Number(variants[index]?.price ?? 0) * line.quantity,
      0,
    );
    const total = itemsTotal + demo.shipping.price;
    // Відправлення Shopify створює лише зі складу, де є всі позиції замовлення.
    const stockedAt = variants.map(
      (variant) =>
        new Set(variant.inventoryItem.inventoryLevels.nodes.map((level) => level.location.id)),
    );
    const fulfilLocationId =
      [...(stockedAt[0] ?? [])].find((id) => stockedAt.every((locations) => locations.has(id))) ??
      null;
    const processedAt = new Date(Date.now() - demo.daysAgo * 24 * 60 * 60 * 1000).toISOString();

    const result = await admin<{
      orderCreate: { order: { id: string; name: string } | null; userErrors: UserError[] };
    }>(
      `mutation ($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {
        orderCreate(order: $order, options: $options) {
          order { id name }
          userErrors { field message }
        }
      }`,
      {
        order: {
          test: true,
          tags: [TAG],
          sourceIdentifier,
          currency: currencyCode,
          processedAt,
          email,
          customer: { toUpsert: { email } },
          lineItems: demo.lines.map((line, index) => ({
            variantId: variants[index]?.id,
            quantity: line.quantity,
          })),
          shippingAddress: {
            firstName: "Покупець",
            lastName: "Демо",
            address1: "вул. Соборна, 12",
            city: "Вінниця",
            zip: "21050",
            countryCode: "UA",
          },
          shippingLines: [{ title: demo.shipping.title, priceSet: money(demo.shipping.price) }],
          financialStatus: demo.financialStatus,
          ...(demo.fulfillmentStatus ? { fulfillmentStatus: demo.fulfillmentStatus } : {}),
          ...(demo.tracking && fulfilLocationId
            ? {
                fulfillment: {
                  locationId: fulfilLocationId,
                  notifyCustomer: false,
                  trackingCompany: "Нова пошта",
                  trackingNumber: demo.tracking.number,
                  shipmentStatus: demo.tracking.shipmentStatus,
                },
              }
            : {}),
          ...(demo.financialStatus === "PENDING"
            ? {}
            : {
                transactions: [
                  {
                    kind: "SALE",
                    status: "SUCCESS",
                    gateway: "manual",
                    test: true,
                    amountSet: money(total),
                  },
                ],
              }),
        },
        options: {
          sendReceipt: false,
          sendFulfillmentReceipt: false,
          inventoryBehaviour: "BYPASS",
        },
      },
    );
    assertNoUserErrors(`Замовлення ${demo.key}`, result.orderCreate.userErrors);
    const order = result.orderCreate.order;
    if (!order) throw new Error(`Shopify не повернув замовлення ${demo.key}.`);

    if (demo.cancel) {
      const cancelled = await admin<{ orderCancel: { orderCancelUserErrors: UserError[] } }>(
        `mutation ($orderId: ID!) {
          orderCancel(orderId: $orderId, reason: CUSTOMER, restock: false, notifyCustomer: false) {
            orderCancelUserErrors { field message }
          }
        }`,
        { orderId: order.id },
      );
      assertNoUserErrors(`Скасування ${order.name}`, cancelled.orderCancel.orderCancelUserErrors);
    }

    created += 1;
    console.log(`Створено ${order.name}: ${demo.key}`);
  }
  console.log(`Готово. Створено: ${created}, уже було: ${ORDERS.length - created}.`);
}

/* ── Запуск ───────────────────────────────────────────────────────────── */

const args = process.argv.slice(2);
if (args.includes("--delete")) {
  await deleteDemoOrders();
} else {
  const email = args.find((arg) => !arg.startsWith("--")) ?? env.SEED_ORDERS_EMAIL;
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error("Вкажіть пошту покупця: npm run seed:orders -- buyer@example.com");
  }
  await createOrders(email);
}
