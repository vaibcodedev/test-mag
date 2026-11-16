/**
 * Стан бічної панелі кошика.
 *
 * Панель — Radix Sheet, якому потрібен керований `open`. Тут він живе поза React, тож відкрити
 * кошик можна звідусіль: кнопкою в шапці, після «Купити» на сторінці товару або через
 * `window.Shopify.actions.openCart()`.
 */

export const CART_DRAWER_ID = "cart-drawer";
const CART_PAGE_PATH = "/cart";

type Listener = () => void;

const listeners = new Set<Listener>();
let open = false;
/** Скільки панелей змонтовано. Поки нуль (до гідратації), посилання /cart просто веде на сторінку. */
let mountedDrawers = 0;
/** Елемент, з якого відкрили кошик: після закриття фокус повертається на нього. */
let opener: HTMLElement | null = null;

let openCartActionConfigured = false;
let openCartActionRetryQueued = false;

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeCartDrawer(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isCartDrawerOpen(): boolean {
  return open;
}

export function isCartDrawerReady(): boolean {
  return mountedDrawers > 0;
}

/** Викликає змонтована панель; повертає функцію для розмонтування. */
export function registerCartDrawer(): () => void {
  mountedDrawers += 1;
  return () => {
    mountedDrawers = Math.max(0, mountedDrawers - 1);
    if (mountedDrawers === 0) setCartDrawerOpen(false);
  };
}

export function setCartDrawerOpen(next: boolean): void {
  if (next === open) return;
  if (next) {
    if (!isCartDrawerReady()) return;
    const active = typeof document === "undefined" ? null : document.activeElement;
    opener = active instanceof HTMLElement && active !== document.body ? active : null;
  }
  open = next;
  emit();
}

export function openCartDrawer(): void {
  setCartDrawerOpen(true);
}

export function closeCartDrawer(): void {
  setCartDrawerOpen(false);
}

/** Повертає фокус туди, звідки відкрили кошик. */
export function restoreCartDrawerFocus(): void {
  const target = opener;
  opener = null;
  if (target?.isConnected) target.focus();
}

type LinkClick = Pick<MouseEvent, "button" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey"> & {
  preventDefault(): void;
};

/**
 * Клік по посиланню на /cart. Перехоплюємо лише звичайний лівий клік і лише коли панель уже
 * змонтована: без JavaScript, у новій вкладці та на самій сторінці кошика посилання працює як є.
 */
export function openCartDrawerFromLinkClick(event: LinkClick): void {
  const isModifiedClick = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  if (event.button !== 0 || isModifiedClick) return;
  if (!isCartDrawerReady()) return;
  if (typeof window !== "undefined" && window.location.pathname === CART_PAGE_PATH) return;
  event.preventDefault();
  openCartDrawer();
}

function configureOpenCartActionNow(): boolean {
  const openCart = typeof window !== "undefined" ? window.Shopify?.actions?.openCart : undefined;
  if (!openCart) return false;

  // Обробник лишається на весь час життя сторінки, тому він не тримає посилань на компоненти.
  openCart.configure({
    handler: async () => openCartDrawer(),
  });
  openCartActionConfigured = true;
  return true;
}

/** Підключає панель до `window.Shopify.actions.openCart()`. */
export function configureOpenCartAction(): void {
  if (typeof document === "undefined" || openCartActionConfigured) return;
  if (configureOpenCartActionNow()) return;
  if (openCartActionRetryQueued || document.readyState !== "loading") return;

  openCartActionRetryQueued = true;
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      openCartActionRetryQueued = false;
      configureOpenCartAction();
    },
    { once: true },
  );
}

configureOpenCartAction();
