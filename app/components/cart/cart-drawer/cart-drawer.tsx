import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from "react";

import {
  configureOpenCartAction,
  isCartDrawerOpen,
  registerCartDrawer,
  setCartDrawerOpen,
  subscribeCartDrawer,
} from "~/lib/cart-drawer";

import { CartStatus } from "./cart-status";

const loadPanel = () => import("./cart-drawer-panel");

// Radix Dialog і вміст кошика не потрібні на першому екрані: вантажимо їх окремим чанком.
const CartDrawerPanel = lazy(() =>
  loadPanel().then((module) => ({ default: module.CartDrawerPanel })),
);

/** Завчасно вантажить панель: викликайте, коли курсор або фокус потрапляє на кнопку кошика. */
export function preloadCartDrawer(): void {
  void loadPanel().catch(() => {
    // Не вдалося завантажити наперед — спробуємо ще раз під час відкриття.
  });
}

const getServerSnapshot = () => false;

/**
 * Бічна панель кошика. Стоїть у кореневому layout один раз; відкривається кнопками кошика,
 * після додавання товару та через `window.Shopify.actions.openCart()`.
 * До гідратації її немає, тому посилання на /cart просто відкриває сторінку кошика.
 */
export function CartDrawer() {
  const open = useSyncExternalStore(subscribeCartDrawer, isCartDrawerOpen, getServerSnapshot);
  // Після першого відкриття панель лишається змонтованою, щоб відпрацювала анімація закриття.
  const [opened, setOpened] = useState(false);
  if (open && !opened) setOpened(true);

  useEffect(() => {
    configureOpenCartAction();
    return registerCartDrawer();
  }, []);

  return (
    <>
      <CartStatus />
      {opened ? (
        <Suspense fallback={null}>
          <CartDrawerPanel open={open} onOpenChange={setCartDrawerOpen} />
        </Suspense>
      ) : null}
    </>
  );
}
