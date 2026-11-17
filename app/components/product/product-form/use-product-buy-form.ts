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
  "РќРµ РІРґР°Р»РѕСЃСЏ РґРѕРґР°С‚Рё С‚РѕРІР°СЂ Сѓ РєРѕС€РёРє. РџРµСЂРµРІС–СЂС‚Рµ Р·'С”РґРЅР°РЅРЅСЏ Р№ РЅР°С‚РёСЃРЅС–С‚СЊ В«РљСѓРїРёС‚РёВ» С‰Рµ СЂР°Р·.";

/**
 * РЎС‚Р°РЅ С„РѕСЂРјРё РєСѓРїС–РІР»С– РЅР° СЃС‚РѕСЂС–РЅС†С– С‚РѕРІР°СЂСѓ РїРѕРІРµСЂС… useProductForm С–Р· Hydrogen:
 * РѕРїС†С–С— РґР»СЏ VariantPicker, РїРѕР»СЏ С„РѕСЂРјРё, СЃС‚Р°РЅ РєРЅРѕРїРєРё, РїРѕРјРёР»РєРё РєРѕС€РёРєР° Р№ С‚РѕСЃС‚ В«Р”РѕРґР°РЅРѕ РІ РєРѕС€РёРєВ».
 *
 * Р’РёРєР»РёРєР°С”С‚СЊСЃСЏ РѕРґРёРЅ СЂР°Р· РЅР° СЃС‚РѕСЂС–РЅРєСѓ: pending Р¶РёРІРµ РІ СЃР°РјРѕРјСѓ С…СѓРєСѓ, С‚РѕР¶ РіРѕР»РѕРІРЅР° РєРЅРѕРїРєР°
 * Р№ Р»РёРїРєР° РїР°РЅРµР»СЊ РјР°СЋС‚СЊ Р±СЂР°С‚Рё Р№РѕРіРѕ Р· РѕРґРЅРѕРіРѕ РјС–СЃС†СЏ. РџРѕС‚СЂРµР±СѓС” ProductProvider РІРёС‰Рµ РІ РґРµСЂРµРІС–.
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
      // Р—РЅР°С‡РµРЅРЅСЏ Р· С–РЅС€РёРј handle РЅР°Р»РµР¶РёС‚СЊ С–РЅС€РѕРјСѓ С‚РѕРІР°СЂСѓ РѕР±'С”РґРЅР°РЅРѕРіРѕ СЃРїРёСЃРєСѓ:
      // С†Рµ Р·РІРёС‡Р°Р№РЅРµ РїРѕСЃРёР»Р°РЅРЅСЏ, selectOption РґР»СЏ РЅСЊРѕРіРѕ РЅРµ РІРёРєР»РёРєР°С”С‚СЊСЃСЏ.
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

  // Р”РѕРґР°РІР°РЅРЅСЏ РЅР° СЃС‚РѕСЂС–РЅС†С– Р№РґСѓС‚СЊ РїРѕ РѕРґРЅРѕРјСѓ: РїРѕРєРё С„РѕСЂРјР° С‡РµРєР°С” РІС–РґРїРѕРІС–РґС–, В«РљСѓРїРёС‚РёВ» Р· РєР°СЂС‚РѕРє
  // (СЃС…РѕР¶С– С‚РѕРІР°СЂРё) СЃС‚Р°С” РІ С‡РµСЂРіСѓ, Р° РїРѕРєРё РґРѕРґР°С”С‚СЊСЃСЏ С‚РѕРІР°СЂ С–Р· РєР°СЂС‚РєРё, С„РѕСЂРјР° РЅРµ РЅР°РґСЃРёР»Р°С” СЃРІС–Р№ Р·Р°РїРёС‚.
  const cartBusy = useSyncExternalStore(subscribeCartAddLock, isCartAddLocked, () => false);
  useEffect(() => (pending ? holdCartAddLock() : undefined), [pending]);

  // РљРѕС€РёРє РІС–РґРєСЂРёРІР°С”РјРѕ РїС–СЃР»СЏ РІС–РґРїРѕРІС–РґС– Р№ Р»РёС€Рµ РєРѕР»Рё РІС–РЅ РЅРµ РїРѕРІРµСЂРЅСѓРІ РїРѕРјРёР»РѕРє:
  // afterSubmit СЃРїСЂР°С†СЊРѕРІСѓС” С– С‚РѕРґС–, РєРѕР»Рё РјР°РіР°Р·РёРЅ РІС–РґС…РёР»РёРІ С‚РѕРІР°СЂ (РїРѕРјРёР»РєРё Р»РµР¶Р°С‚СЊ РІ errors).
  const [submissions, setSubmissions] = useState(0);
  const latest = useRef({ failed: false, title: product.title });
  useEffect(() => {
    latest.current = { failed: errorMessages.length > 0, title: product.title };
  });
  useEffect(() => {
    if (submissions === 0 || latest.current.failed) return;
    // РќР° СЃС‚РѕСЂС–РЅС†С– С‚РѕРІР°СЂСѓ РїС–СЃР»СЏ РґРѕРґР°РІР°РЅРЅСЏ РІС–РґРєСЂРёРІР°С”РјРѕ РєРѕС€РёРє: РЅР°СЃС‚СѓРїРЅРёР№ РєСЂРѕРє вЂ” РѕС„РѕСЂРјР»РµРЅРЅСЏ.
    // РўРѕСЃС‚Р° В«Р”РѕРґР°РЅРѕ РІ РєРѕС€РёРєВ» С‚СѓС‚ РЅРµРјР°С”: СЃР°Рј РєРѕС€РёРє С†Рµ Р№ РїРѕРєР°Р·СѓС”, Р° С‚РѕСЃС‚ Р·Р°РєСЂРёРІР°РІ Р±Рё Р№РѕРіРѕ РєРЅРѕРїРєРё.
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
        // РџРѕРІС‚РѕСЂРЅРёР№ Enter, РїРѕРєРё С‚РѕРІР°СЂ РґРѕРґР°С”С‚СЊСЃСЏ, РЅРµ РјР°С” СЃС‚РІРѕСЂСЋРІР°С‚Рё РґСЂСѓРіРµ РґРѕРґР°РІР°РЅРЅСЏ.
        beforeSubmit: (event) => {
          if (pending || isCartAddLocked()) event.preventDefault();
        },
        // Р’С–РґРїРѕРІС–РґСЊ РїСЂРёР№С€Р»Р°. Р§Рё РІРѕРЅР° Р±РµР· РїРѕРјРёР»РѕРє, РІРёСЂС–С€СѓС” РµС„РµРєС‚ РІРёС‰Рµ: РІС–РЅ Р±Р°С‡РёС‚СЊ СЃРІС–Р¶С– errors.
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
