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
