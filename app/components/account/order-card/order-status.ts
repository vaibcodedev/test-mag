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

/** Крок шляху замовлення на картці. */
export type OrderProgressStep = {
  key: "placed" | "payment" | "delivery";
  /** Що описує крок — для зчитувача екрана. */
  prefix: string;
  label: string;
  state: "done" | "current" | "upcoming" | "problem";
};

/** Оплату отримано (або вже й повернено): крок пройдено. */
const PAYMENT_DONE = new Set(["PAID", "PARTIALLY_REFUNDED", "REFUNDED"]);
const PAYMENT_PROBLEM = new Set(["EXPIRED", "VOIDED"]);
const DELIVERY_DONE = new Set(["FULFILLED"]);
const DELIVERY_PROBLEM = new Set(["ON_HOLD"]);

/**
 * Шлях замовлення трьома кроками: оформлено → оплата → доставка. Підписи ті самі, що й у
 * бейджів. Скасоване замовлення шляху не має (null): йому лишаються бейджі «Скасовано».
 * Крок із невідомим кодом пропускаємо, щоб не показувати англійський текст.
 */
export function orderProgress(
  order: Pick<AccountOrder, "cancelledAt" | "financialStatus" | "fulfillmentStatus">,
): OrderProgressStep[] | null {
  if (order.cancelledAt) return null;
  const { payment, delivery } = orderStatuses(order);
  if (!payment && !delivery) return null;

  const steps: OrderProgressStep[] = [
    { key: "placed", prefix: "Замовлення", label: "Оформлено", state: "done" },
  ];

  const paymentCode = order.financialStatus ?? "";
  const paid = PAYMENT_DONE.has(paymentCode);
  if (payment) {
    steps.push({
      key: "payment",
      prefix: "Оплата",
      label: payment.label,
      state: paid ? "done" : PAYMENT_PROBLEM.has(paymentCode) ? "problem" : "current",
    });
  }

  if (delivery) {
    const code = order.fulfillmentStatus ?? "";
    const started = code !== "UNFULFILLED" && code !== "OPEN" && code !== "PENDING_FULFILLMENT";
    steps.push({
      key: "delivery",
      prefix: "Доставка",
      label: delivery.label,
      state: DELIVERY_DONE.has(code)
        ? "done"
        : DELIVERY_PROBLEM.has(code)
          ? "problem"
          : // Доставка «триває», коли вже щось зроблено або оплату отримано й черга за нами.
            started || paid || !payment
            ? "current"
            : "upcoming",
    });
  }

  return steps;
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

/** Замовлення ще в дорозі: є крок, який не пройдено. Лише такому потрібен шлях кроками. */
export function orderInProgress(
  order: Pick<AccountOrder, "cancelledAt" | "financialStatus" | "fulfillmentStatus">,
): boolean {
  return orderProgress(order)?.some((step) => step.state !== "done") ?? false;
}
