import { formatPrice, type Money } from "~/lib/format";

import type { OrderAdjustments, OrderDetailsData, OrderDiscount } from "./order-details.types";

/**
 * Рядки розрахунку замовлення. Суми беремо з API як є й нічого не рахуємо самі: власна
 * арифметика розходиться з Shopify на знижках, податках і заокругленні.
 */
export type OrderTotalRow = {
  key: string;
  label: string;
  /** Готовий текст значення: «64 999 ₴», «Безкоштовно», «−10%». */
  value: string;
  /** `discount` — знижка (рожевий sale), `total` — підсумок, `refund` — повернення. */
  tone?: "discount" | "total" | "refund";
  /** Пояснення під рядком. */
  note?: string;
};

function isPositive(money: Money | null | undefined): money is Money {
  return money != null && Number.parseFloat(money.amount) > 0;
}

function isZero(money: Money | null | undefined): money is Money {
  return money != null && Number.parseFloat(money.amount) === 0;
}

const minus = (value: string) => `−${value}`;

/** «−500 ₴» або «−10%»; `null`, якщо значення знижки невідоме чи нульове. */
export function discountValueLabel(value: OrderDiscount["value"]): string | null {
  if (!value) return null;
  if ("percentage" in value && typeof value.percentage === "number") {
    return value.percentage > 0 ? minus(`${Number(value.percentage.toFixed(2))}%`) : null;
  }
  if ("amount" in value && typeof value.amount === "string") {
    const money = { amount: value.amount, currencyCode: value.currencyCode };
    return isPositive(money) ? minus(formatPrice(money)) : null;
  }
  return null;
}

function discountRow(discount: OrderDiscount, index: number): OrderTotalRow | null {
  const value = discountValueLabel(discount.value);
  if (!value) return null;
  const name = (discount.code ?? discount.title ?? "").trim();
  const subject = discount.targetType === "SHIPPING_LINE" ? "Знижка на доставку" : "Знижка";

  return {
    key: `discount-${index}`,
    label: name ? `${subject} «${name}»` : subject,
    value,
    tone: "discount",
  };
}

/**
 * Розрахунок замовлення: товари, знижки, доставка, податки, разом, повернено.
 * Рядка, який нічого не означає, немає: нульові податки й повернення пропускаємо, а нульова
 * доставка лишається лише там, де доставка була («Безкоштовно»).
 */
export function orderTotalRows(
  order: Pick<OrderDetailsData, "subtotal" | "totalShipping" | "totalTax" | "totalPrice">,
  adjustments?: OrderAdjustments | null,
): OrderTotalRow[] {
  const rows: OrderTotalRow[] = [];
  const discounts = (adjustments?.discountApplications?.nodes ?? []).flatMap(
    (discount, index) => discountRow(discount, index) ?? [],
  );

  if (order.subtotal) {
    rows.push({
      key: "subtotal",
      label: "Товари",
      value: formatPrice(order.subtotal),
      // Сума товарів з API вже зі знижками: рядки знижок нижче її пояснюють, а не зменшують.
      note: discounts.length > 0 ? "Знижки вже враховано" : undefined,
    });
  }
  rows.push(...discounts);

  if (isPositive(order.totalShipping)) {
    rows.push({ key: "shipping", label: "Доставка", value: formatPrice(order.totalShipping) });
  } else if (isZero(order.totalShipping) && adjustments?.shippingLine) {
    rows.push({ key: "shipping", label: "Доставка", value: "Безкоштовно" });
  }

  if (isPositive(order.totalTax)) {
    rows.push({ key: "tax", label: "Податки", value: formatPrice(order.totalTax) });
  }

  rows.push({ key: "total", label: "Разом", value: formatPrice(order.totalPrice), tone: "total" });

  if (isPositive(adjustments?.totalRefunded)) {
    rows.push({
      key: "refunded",
      label: "Повернено",
      value: minus(formatPrice(adjustments.totalRefunded)),
      tone: "refund",
    });
  }

  return rows;
}
