import { plural } from "~/lib/format";

import type { AccountOrder, OrderLineItem } from "./order-card.types";

/** Скільки плиток уміщує рядок мініатюр; остання за потреби стає лічильником «+N». */
export const ORDER_THUMB_SLOTS = 4;

const ITEM_FORMS = { one: "товар", few: "товари", many: "товарів" };

export type OrderItemsPreview = {
  /** Позиції, які показуємо мініатюрами. */
  thumbs: readonly OrderLineItem[];
  /** Скільки позицій сховано за плиткою «+N». */
  hiddenCount: number;
  /** Скільки в замовленні різних позицій. */
  lineCount: number;
  /** Скільки одиниць товару разом. */
  totalQuantity: number;
};

/**
 * Що показати в рядку мініатюр. Якщо позицій не більше, ніж плиток, показуємо всі;
 * інакше остання плитка — лічильник решти. Підсумок із API може бути відсутній, тоді
 * рахуємо з отриманих позицій.
 */
export function orderItemsPreview(
  order: Pick<AccountOrder, "lineItems" | "lineItemsSummary">,
  slots: number = ORDER_THUMB_SLOTS,
): OrderItemsPreview {
  const items = order.lineItems?.nodes ?? [];
  const lineCount = Math.max(order.lineItemsSummary?.lineItemCount ?? 0, items.length);
  const loadedQuantity = items.reduce((sum, item) => sum + Math.max(item.quantity, 0), 0);
  const totalQuantity = Math.max(
    order.lineItemsSummary?.totalQuantityOfLineItems ?? 0,
    loadedQuantity,
  );
  const thumbs = lineCount <= slots ? items.slice(0, slots) : items.slice(0, slots - 1);

  return { thumbs, hiddenCount: lineCount - thumbs.length, lineCount, totalQuantity };
}

/** «3 товари». */
export function itemCountLabel(count: number): string {
  return `${count} ${plural(count, ITEM_FORMS)}`;
}

/** «iPhone 17 Pro та ще 2 товари»: назва першої позиції й скільки є ще. */
export function orderItemsSummary(preview: OrderItemsPreview): string | null {
  const first = preview.thumbs[0]?.title.trim();
  if (!first) return null;
  const rest = preview.lineCount - 1;
  return rest > 0 ? `${first} та ще ${itemCountLabel(rest)}` : first;
}
