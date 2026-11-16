import { ShopPayButton, type ShopPayButtonProps } from "@shopify/hydrogen/react";

/** Радіус кнопки Shop Pay: дорівнює радіусу наших кнопок (токен --r-md). */
const SHOP_PAY_RADIUS = "var(--r-md)";

/**
 * Кнопка живе в закритому від стилів сторінки shadow DOM, і Hydrogen дає лише width та
 * borderRadius. Решту робить обгортка:
 * — фокус: посилання всередині має власне бліде кільце (#9c83f8), якого на білому замало,
 *   тому обгортка показує наше кільце через :focus-within (він бачить фокус у shadow DOM,
 *   на відміну від :has(:focus-visible));
 * — ціль натискання: саме посилання заввишки 42px. Елемент-господар стає flex-контейнером
 *   із min-height 44px, і посилання (flex-елемент у його shadow-дереві) розтягується на всю висоту.
 */
const WRAPPER =
  "rounded-md outline-2 outline-offset-2 outline-transparent transition-shadow duration-150 focus-within:shadow-focus-offset [&>hydrogen-shop-pay-button]:flex [&>hydrogen-shop-pay-button]:min-h-11";

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
 *
 * Про mock.shop. З `variants` кнопка веде на пермалінк `/cart/<id>:<кількість>`, а
 * handleShopifyRoutes перенаправляє його на домен магазину. Для будь-якого хоста *.mock.shop
 * Hydrogen підставляє сталу адресу `https://demostore.mock.shop` (MOCK_SHOP_PERMALINK_ORIGIN у
 * @shopify/hydrogen core/request-routing/interceptors/checkout), і там такого варіанта немає —
 * звідси 404 у демо. Кнопка в кошику (`/checkout`) іде за `checkoutUrl` самого кошика, тому
 * працює. Це обмеження мок-магазину, а не налаштувань: у ShopPayButton немає ні `storeDomain`,
 * ні `shop`, а для справжнього магазину пермалінк іде на його власний домен. `checkoutUrl`
 * тут навмисно не передаємо (так радить hydrogen-shop-pay, коли шляхи обробляє
 * handleShopifyRoutes) і 404 мок-магазину не обходимо.
 */
export function ShopPay({ variants, disabled = false, label }: ShopPayProps) {
  return (
    <div data-slot="shop-pay" className={WRAPPER}>
      <ShopPayButton
        variants={variants}
        disabled={disabled}
        width="100%"
        borderRadius={SHOP_PAY_RADIUS}
        accessibilityLabel={label}
      />
    </div>
  );
}
