import { useEffect, useState } from "react";

/** Те, що IntersectionObserver повідомив про головну кнопку «Купити». */
export type BuyButtonPosition = {
  isIntersecting: boolean;
  /** Нижній край кнопки відносно верху вікна. */
  bottom: number;
};

/** Те, що IntersectionObserver повідомив про позначку кінця сторінки товару. */
export type PageEndPosition = {
  isIntersecting: boolean;
  /** Верхній край позначки відносно верху вікна. */
  top: number;
};

/**
 * Чи показувати липку панель «Купити».
 *
 * Панель з'являється, коли головна кнопка прокрутилась угору за межі екрана, і ховається,
 * коли видно кінець сторінки товару (або його вже прокрутили): так вона не накриває підвал.
 * Доки спостерігач нічого не повідомив, панель схована.
 */
export function isStickyBarVisible(
  button: BuyButtonPosition | null,
  pageEnd: PageEndPosition | null,
): boolean {
  if (!button || button.isIntersecting || button.bottom > 0) return false;
  if (pageEnd && (pageEnd.isIntersecting || pageEnd.top < 0)) return false;
  return true;
}

/**
 * Стежить за головною кнопкою «Купити» та позначкою кінця сторінки.
 * Елементи передаються як стан (ref-колбек), щоб хук помітив, коли кнопка з'явилась чи зникла.
 */
export function useStickyBuyBar(button: Element | null, pageEnd: Element | null): boolean {
  const [buttonPosition, setButtonPosition] = useState<BuyButtonPosition | null>(null);
  const [endPosition, setEndPosition] = useState<PageEndPosition | null>(null);

  useEffect(() => {
    if (!button || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      setButtonPosition({
        isIntersecting: entry.isIntersecting,
        bottom: entry.boundingClientRect.bottom,
      });
    });
    observer.observe(button);
    return () => {
      observer.disconnect();
      setButtonPosition(null);
    };
  }, [button]);

  useEffect(() => {
    if (!pageEnd || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      setEndPosition({ isIntersecting: entry.isIntersecting, top: entry.boundingClientRect.top });
    });
    observer.observe(pageEnd);
    return () => {
      observer.disconnect();
      setEndPosition(null);
    };
  }, [pageEnd]);

  return isStickyBarVisible(buttonPosition, endPosition);
}
