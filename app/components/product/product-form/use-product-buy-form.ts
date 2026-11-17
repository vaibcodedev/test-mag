import { openCartDrawer } from "~/lib/cart-drawer";
import { canAddToCart } from "@shopify/hydrogen";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocation } from "react-router";

import type { VariantPickerOption } from "~/components/product/variant-picker";
import { holdCartAddLock, isCartAddLocked, subscribeCartAddLock } from "~/lib/cart-add-lock";
import { useProductForm } from "~/lib/product";
import {
  productColorSwatches,
  productVariantUrl,
  swatchKey,
  type ProductPageData,
} from "~/lib/shopify/product";

import type { PurchaseState } from "./product-form";

const NETWORK_ERROR =
  "Не вдалося додати товар у кошик. Перевірте з'єднання й натисніть «Купити» ще раз.";

/**
 * Стан форми купівлі на сторінці товару поверх useProductForm із Hydrogen:
 * опції для VariantPicker, поля форми, стан кнопки, помилки кошика й тост «Додано в кошик».
 *
 * Викликається один раз на сторінку: pending живе в самому хуку, тож головна кнопка
 * й липка панель мають брати його з одного місця. Потребує ProductProvider вище в дереві.
 */
export function useProductBuyForm(product: ProductPageData, formId: string) {
  const { options, selectedVariant, register, formProps, errors, pending } = useProductForm();
  const location = useLocation();
  const baseParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const swatches = useMemo(() => productColorSwatches(product), [product]);

  const state: PurchaseState = canAddToCart(product, options)
    ? "available"
    : !selectedVariant
      ? "unselected"
      : selectedVariant.availableForSale
        ? "unavailable"
        : "sold-out";

  const pickerOptions: VariantPickerOption[] = options.map((option) => ({
    name: option.name,
    values: option.values.map((value) => {
      // Значення з іншим handle належить іншому товару об'єднаного списку:
      // це звичайне посилання, selectOption для нього не викликається.
      const sameProduct = value.handle === product.handle;

      return {
        name: value.name,
        selected: value.selected,
        exists: !sameProduct || value.exists,
        available: value.available,
        swatch: swatches.get(swatchKey(option.name, value.name)) ?? null,
        to: productVariantUrl(product, value.selectedOptions, value.handle, baseParams),
        onSelect: sameProduct
          ? register("optionValue", { optionName: option.name, value: value.name }).onClick
          : undefined,
      };
    }),
  }));

  const errorMessages = [
    ...new Set([
      ...errors.userErrors.map((error) => error.message),
      ...errors.warnings.map((warning) => warning.message),
      ...(errors.networkErrors.length > 0 ? [NETWORK_ERROR] : []),
    ]),
  ];

  // Додавання на сторінці йдуть по одному: поки форма чекає відповіді, «Купити» з карток
  // (схожі товари) стає в чергу, а поки додається товар із картки, форма не надсилає свій запит.
  const cartBusy = useSyncExternalStore(subscribeCartAddLock, isCartAddLocked, () => false);
  useEffect(() => (pending ? holdCartAddLock() : undefined), [pending]);

  // Кошик відкриваємо після відповіді й лише коли він не повернув помилок:
  // afterSubmit спрацьовує і тоді, коли магазин відхилив товар (помилки лежать в errors).
  const [submissions, setSubmissions] = useState(0);
  const latest = useRef({ failed: false, title: product.title });
  useEffect(() => {
    latest.current = { failed: errorMessages.length > 0, title: product.title };
  });
  useEffect(() => {
    if (submissions === 0 || latest.current.failed) return;
    // На сторінці товару після додавання відкриваємо кошик: наступний крок — оформлення.
    // Тоста «Додано в кошик» тут немає: сам кошик це й показує, а тост закривав би його кнопки.
    openCartDrawer();
  }, [submissions]);

  return {
    selectedVariant,
    pickerOptions,
    state,
    pending: pending || cartBusy,
    errors: errorMessages,
    form: {
      id: formId,
      ...formProps({
        // Повторний Enter, поки товар додається, не має створювати друге додавання.
        beforeSubmit: (event) => {
          if (pending || isCartAddLocked()) event.preventDefault();
        },
        // Відповідь прийшла. Чи вона без помилок, вирішує ефект вище: він бачить свіжі errors.
        afterSubmit: () => {
          setSubmissions((count) => count + 1);
        },
      }),
    },
    fields: {
      merchandiseId: register("merchandiseId", {}),
      quantity: register("quantity", { value: 1 }),
      submit: register("addToCart", {}),
    },
  };
}
