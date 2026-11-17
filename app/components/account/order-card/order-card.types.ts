import type { Money } from "~/lib/format";

export type OrderLineItem = {
  id: string;
  title: string;
  quantity: number;
  image?: { url: string; width?: number | null; height?: number | null } | null;
};

/** Замовлення покупця з Customer Account API. */
export type AccountOrder = {
  id: string;
  /** Номер замовлення, як у листі: «#1001». */
  name: string;
  /** Дата оформлення в ISO 8601. */
  processedAt: string;
  /** Дата скасування; порожня, якщо замовлення чинне. */
  cancelledAt?: string | null;
  /** Стан оплати: PAID, PENDING … */
  financialStatus?: string | null;
  /** Стан відправлення: UNFULFILLED, FULFILLED … */
  fulfillmentStatus?: string | null;
  /** Сторінка стану замовлення в Shopify. */
  statusPageUrl: string;
  totalPrice: Money;
  /** Скільки в замовленні позицій і одиниць товару загалом. */
  lineItemsSummary?: { lineItemCount: number; totalQuantityOfLineItems: number } | null;
  /** Перші позиції замовлення — для мініатюр. */
  lineItems?: { nodes: readonly OrderLineItem[] } | null;
};
