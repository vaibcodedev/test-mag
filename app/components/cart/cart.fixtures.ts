import { createCartFormRegister } from "@shopify/hydrogen";
import type { SubmitEvent } from "react";

import type { CartLineData, CartLineForm } from "~/components/cart/cart-line";
import type { Money } from "~/lib/format";

/**
 * Демо-дані кошика для історій Storybook і тестів.
 * На сайті рядки приходять зі стору Hydrogen (useCart), а форма — з useCartForm().
 */

const CDN =
  "https://cdn.shopify.com/mock-shop-production-media/_image_studio/ea62fe2c-4ccf-4787-9cf0-dbfa4a4f2747";

function uah(amount: number): Money {
  return { amount: String(amount), currencyCode: "UAH" };
}

export const DEMO_CART_LINE: CartLineData = {
  id: "gid://shopify/CartLine/1?cart=demo",
  quantity: 1,
  cost: {
    totalAmount: uah(64999),
    amountPerQuantity: uah(64999),
    compareAtAmountPerQuantity: null,
  },
  merchandise: {
    title: "256 ГБ / Синій титан",
    selectedOptions: [
      { name: "Пам'ять", value: "256 ГБ" },
      { name: "Колір", value: "Синій титан" },
    ],
    image: {
      url: `${CDN}/2c9dfe14599dfdf016b15700528a30f9822ad13cb9e2095ad6000685fa06a18a.png`,
      altText: null,
      width: 928,
      height: 1152,
    },
    product: { title: "iPhone 17 Pro", handle: "iphone-17-pro" },
  },
};

export const DEMO_CART_LINE_SALE: CartLineData = {
  id: "gid://shopify/CartLine/2?cart=demo",
  quantity: 2,
  cost: {
    totalAmount: uah(17998),
    amountPerQuantity: uah(8999),
    compareAtAmountPerQuantity: uah(9999),
  },
  merchandise: {
    title: "Default Title",
    selectedOptions: [{ name: "Title", value: "Default Title" }],
    image: {
      url: `${CDN}/358d3ff45f4d76d9dd474f5cae4e019d3a2394c05c470f733ceacb79c58c6d7d.png`,
      altText: null,
      width: 928,
      height: 1152,
    },
    product: { title: "AirPods 4", handle: "airpods-4" },
  },
};

export const DEMO_CART_LINES: CartLineData[] = [DEMO_CART_LINE, DEMO_CART_LINE_SALE];

export const DEMO_CART_TOTALS = {
  subtotal: uah(82997),
  total: uah(82997),
  checkoutUrl: "https://sad.example/checkout/demo",
};

export type DemoCartSubmit = {
  intent: string | null;
  lineId: string | null;
  quantity: string | null;
};

/**
 * Форма рядка без стору кошика: ті самі поля, що дає `useCartForm()`, але відправка
 * не йде на сервер, а потрапляє в `onSubmit`.
 */
export function createDemoCartForm(onSubmit?: (submit: DemoCartSubmit) => void): CartLineForm {
  const coreRegister = createCartFormRegister();

  // Як і в React-обгортці Hydrogen, інтерактивне поле кількості лишається некерованим.
  const register = ((field: string, options?: Record<string, unknown>) => {
    const attributes = (coreRegister as (...args: unknown[]) => Record<string, unknown>)(
      field,
      options,
    );
    if (field === "quantity" && options?.interactive === true) {
      const { value, ...rest } = attributes;
      return { ...rest, defaultValue: value };
    }
    return attributes;
  }) as CartLineForm["register"];

  return {
    register,
    formProps: (options) => ({
      method: "post",
      action: "/api/cart",
      onSubmit: (event) => {
        const submitEvent = event as SubmitEvent<HTMLFormElement>;
        options?.beforeSubmit?.(submitEvent);
        if (event.defaultPrevented) return;
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const submitter = submitEvent.nativeEvent.submitter;
        onSubmit?.({
          intent: submitter?.getAttribute("value") ?? null,
          lineId: data.get("lineId") as string | null,
          quantity: data.get("quantity") as string | null,
        });
        options?.afterSubmit?.(submitEvent);
      },
    }),
  };
}
