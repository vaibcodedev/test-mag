import { useCallback, useEffect, useRef } from "react";

import { useOptionalCart } from "~/lib/cart";

/** Скільки чекаємо, доки стор кошика під'єднається й завантажить кошик. */
export const CART_READY_TIMEOUT_MS = 8000;
const CART_READY_POLL_MS = 50;

export type UpdateCart = NonNullable<NonNullable<Window["Shopify"]>["actions"]>["updateCart"];
export type CartStoreStatus = { loading: boolean; loadPending: boolean } | null;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Умови Hydrogen для зміни кошика з коду (скіл hydrogen-cart-ui, «Code-driven cart changes»):
 * стор кошика вже налаштував `updateCart` (інакше запит піде повз маршрут /api/cart
 * у типовий обробник Shopify) і перше завантаження кошика завершилось (інакше зміна
 * може сховати решту товарів покупця).
 */
export async function waitForCartStore(
  updateCart: UpdateCart,
  getStatus: () => CartStoreStatus,
): Promise<boolean> {
  const deadline = Date.now() + CART_READY_TIMEOUT_MS;

  for (;;) {
    const status = getStatus();
    if (!updateCart.isDefault() && status && !status.loading && !status.loadPending) return true;
    if (Date.now() >= deadline) return false;
    await delay(CART_READY_POLL_MS);
  }
}

/**
 * Поточний стан стору кошика для `waitForCartStore`. Повертає функцію, а не значення: вона
 * читає найсвіжіший стан і під час очікування, вже після рендеру, який почав додавання.
 */
export function useCartStoreStatus(): () => CartStoreStatus {
  // Поза CartProvider (тести, сторібук) хук повертає undefined: тоді стор вважаємо не готовим.
  const loading = useOptionalCart((state) => state.loading);
  const loadPending = useOptionalCart((state) => state.readyPromise !== undefined);
  const status = useRef<CartStoreStatus>(null);
  useEffect(() => {
    status.current = loading === undefined ? null : { loading, loadPending: loadPending === true };
  }, [loading, loadPending]);

  return useCallback(() => status.current, []);
}
