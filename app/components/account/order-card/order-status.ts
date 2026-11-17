import type { AccountOrder } from "./order-card.types";

/** Забарвлення іконки бейджа: стан завжди названо текстом, колір лише підсилює. */
export type OrderStatusTone = "positive" | "neutral" | "attention";

export type OrderStatus = { label: string; tone: OrderStatusTone };

const PAYMENT_STATUS: Record<string, OrderStatus> = {
  AUTHORIZED: { label: "Кошти зарезервовано", tone: "neutral" },
  EXPIRED: { label: "Термін оплати минув", tone: "attention" },
  PAID: { label: "Оплачено", tone: "positive" },
  PARTIALLY_PAID: { label: "Оплачено частково", tone: "attention" },
  PARTIALLY_REFUNDED: { label: "Частину коштів повернено", tone: "neutral" },
  PENDING: { label: "Очікує оплати", tone: "attention" },
  REFUNDED: { label: "Кошти повернено", tone: "neutral" },
  VOIDED: { label: "Оплату скасовано", tone: "neutral" },
};

const PREPARING: OrderStatus = { label: "Готуємо до відправлення", tone: "neutral" };

const FULFILLMENT_STATUS: Record<string, OrderStatus> = {
  FULFILLED: { label: "Виконано", tone: "positive" },
  IN_PROGRESS: { label: "Комплектуємо", tone: "neutral" },
  ON_HOLD: { label: "Відправлення призупинено", tone: "attention" },
  OPEN: PREPARING,
  PARTIALLY_FULFILLED: { label: "Відправлено частково", tone: "neutral" },
  PENDING_FULFILLMENT: PREPARING,
  READY_FOR_DELIVERY: { label: "Готове до доставки", tone: "positive" },
  READY_FOR_PICKUP: { label: "Готове до видачі", tone: "positive" },
  RESTOCKED: { label: "Повернено на склад", tone: "neutral" },
  SCHEDULED: { label: "Відправлення заплановано", tone: "neutral" },
  UNFULFILLED: PREPARING,
};

const CANCELLED: OrderStatus = { label: "Скасовано", tone: "attention" };

/** Невідомий код не показуємо, щоб не лишати на сторінці англійський текст. */
function lookup(table: Record<string, OrderStatus>, code: string | null | undefined) {
  if (!code || !Object.hasOwn(table, code)) return null;
  return table[code] ?? null;
}

/** Стан оплати українською. */
export function paymentStatus(code: string | null | undefined): OrderStatus | null {
  return lookup(PAYMENT_STATUS, code);
}

/** Стан відправлення українською. */
export function fulfillmentStatus(code: string | null | undefined): OrderStatus | null {
  return lookup(FULFILLMENT_STATUS, code);
}

/**
 * Стани для бейджів картки замовлення. У скасованого замовлення стан відправлення
 * вже нічого не означає, тому замість нього — «Скасовано».
 */
export function orderStatuses(
  order: Pick<AccountOrder, "cancelledAt" | "financialStatus" | "fulfillmentStatus">,
): { payment: OrderStatus | null; delivery: OrderStatus | null } {
  return {
    payment: paymentStatus(order.financialStatus),
    delivery: order.cancelledAt ? CANCELLED : fulfillmentStatus(order.fulfillmentStatus),
  };
}

/** Етап шляху замовлення на картці. */
export type OrderProgressStep = {
  key: "placed" | "payment" | "packing" | "shipping";
  label: string;
  /** done — пройдено, current — триває зараз, upcoming — ще попереду, problem — зупинився. */
  state: "done" | "current" | "upcoming" | "problem";
};

/** Оплату отримано (або вже й повернено): етап пройдено. */
const PAYMENT_DONE = new Set(["PAID", "PARTIALLY_REFUNDED", "REFUNDED"]);
const PAYMENT_PROBLEM = new Set(["EXPIRED", "VOIDED"]);
/** Замовлення зібране: його вже передали (хоча б частково) або воно чекає на видачу. */
const PACKED = new Set([
  "FULFILLED",
  "PARTIALLY_FULFILLED",
  "READY_FOR_DELIVERY",
  "READY_FOR_PICKUP",
]);
const SHIPPING_STOPPED = new Set(["ON_HOLD", "RESTOCKED"]);

/**
 * Шлях замовлення — завжди той самий повний ланцюжок із чотирьох етапів, щоб було видно і
 * пройдене, і те, що попереду: оформлення → оплата → комплектування → відправлення.
 * Скасоване замовлення й замовлення з невідомими кодами шляху не мають (null).
 */
export function orderProgress(
  order: Pick<AccountOrder, "cancelledAt" | "financialStatus" | "fulfillmentStatus">,
): OrderProgressStep[] | null {
  if (order.cancelledAt) return null;
  const { payment, delivery } = orderStatuses(order);
  if (!payment && !delivery) return null;

  const paymentCode = order.financialStatus ?? "";
  const code = order.fulfillmentStatus ?? "";
  const paid = PAYMENT_DONE.has(paymentCode);
  const packed = PACKED.has(code);
  const shipped = code === "FULFILLED";
  const stopped = SHIPPING_STOPPED.has(code);

  return [
    { key: "placed", label: "Оформлення", state: "done" },
    {
      key: "payment",
      label: "Оплата",
      state: paid ? "done" : PAYMENT_PROBLEM.has(paymentCode) ? "problem" : "current",
    },
    {
      key: "packing",
      label: "Комплектування",
      // Збирати починаємо після оплати; зібране замовлення пройшло етап за будь-якої оплати.
      state: packed ? "done" : stopped ? "problem" : paid ? "current" : "upcoming",
    },
    {
      key: "shipping",
      label: "Відправлення",
      state: shipped ? "done" : packed ? "current" : "upcoming",
    },
  ];
}

/**
 * Головний стан замовлення одним рядком — відповідь на «що з моїм замовленням?».
 * Скасування важливіше за все; далі — оплата, якщо вона чекає на покупця; далі — доставка.
 */
export function orderHeadline(
  order: Pick<AccountOrder, "cancelledAt" | "financialStatus" | "fulfillmentStatus">,
): OrderStatus & { cancelled: boolean } {
  const { payment, delivery } = orderStatuses(order);
  if (order.cancelledAt) return { ...CANCELLED, cancelled: true };
  const status =
    payment?.tone === "attention"
      ? payment
      : (delivery ?? payment ?? { label: "Оформлено", tone: "neutral" as const });
  return { ...status, cancelled: false };
}
