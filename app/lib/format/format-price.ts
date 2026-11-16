import { formatMoney, type MoneyV2 } from "@shopify/hydrogen";

export const LOCALE = "uk-UA";

export type Money = Pick<MoneyV2, "amount" | "currencyCode">;

/** «119 999 ₴»: без копійок, нерозривний пробіл між розрядами. */
export function formatPrice(money: Money, locale: string = LOCALE): string {
  return formatMoney(money, {
    locale,
    withoutTrailingZeros: true,
    // Без цього uk-UA дає «грн» замість «₴».
    currencyDisplay: "narrowSymbol",
  }).toString();
}

function toNumber(money: Money): number {
  return Number.parseFloat(money.amount);
}

/** Чи справді стара ціна вища за поточну. */
export function isOnSale(price: Money, compareAt: Money | null | undefined): compareAt is Money {
  if (!compareAt || compareAt.currencyCode !== price.currencyCode) return false;
  const current = toNumber(price);
  const previous = toNumber(compareAt);
  return Number.isFinite(current) && Number.isFinite(previous) && previous > current;
}

/** Різниця між старою і новою ціною для підпису «Економія N ₴». */
export function savings(price: Money, compareAt: Money | null | undefined): Money | null {
  if (!isOnSale(price, compareAt)) return null;
  return {
    amount: String(toNumber(compareAt) - toNumber(price)),
    currencyCode: price.currencyCode,
  };
}

/** Відсоток знижки для бейджа «−8%». */
export function discountPercent(price: Money, compareAt: Money | null | undefined): number | null {
  if (!isOnSale(price, compareAt)) return null;
  const previous = toNumber(compareAt);
  return Math.round(((previous - toNumber(price)) / previous) * 100);
}

/** Щомісячний платіж за оплати частинами, округлений угору до гривні. */
export function installmentPayment(price: Money, months: number): Money | null {
  const total = toNumber(price);
  if (!Number.isFinite(total) || !Number.isInteger(months) || months <= 0) return null;
  return { amount: String(Math.ceil(total / months)), currencyCode: price.currencyCode };
}
