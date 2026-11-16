import { ShopPayButton, type ShopPayButtonProps } from "@shopify/hydrogen/react";

/** Радіус кнопки Shop Pay: дорівнює радіусу наших кнопок (токен --r-md). */
const SHOP_PAY_RADIUS = "var(--r-md)";

export type ShopPayProps = {
  /**
   * Варіанти для покупки одразу зі сторінки товару. Без них кнопка оформлює поточний кошик:
   * веде на /checkout, який handleShopifyRoutes перенаправляє в оформлення магазину.
   */
  variants?: ShopPayButtonProps["variants"];
  /** Кошик чи товар саме змінюється: кнопка лишається на місці, але без посилання. */
  disabled?: boolean;
  /** Назва для читачів екрана; «Shop Pay» не перекладаємо. */
  label: string;
};

/**
 * Швидка оплата Shop Pay на всю ширину під головною кнопкою.
 * Hydrogen рендерить її на сервері звичайним посиланням, тож вона працює й без JavaScript.
 */
export function ShopPay({ variants, disabled = false, label }: ShopPayProps) {
  return (
    <ShopPayButton
      variants={variants}
      disabled={disabled}
      width="100%"
      borderRadius={SHOP_PAY_RADIUS}
      accessibilityLabel={label}
    />
  );
}
