import type { StorefrontApi } from "@shopify/hydrogen";

import { SAVED_PRODUCTS_QUERY, SAVED_PRODUCTS_SLOTS } from "~/graphql/queries/saved-products.query";
import { isValidHandle, SAVED_PRODUCTS_PAGE_SIZE, type SavedProduct } from "~/lib/saved-lists";
import type { StorefrontGraphqlClient } from "~/lib/storefront";

import { logGraphqlErrors } from "./errors";
import { toProductCard } from "./product-card";

type SavedProductsResult = StorefrontApi.ResultOf<typeof SAVED_PRODUCTS_QUERY>;
type SavedProductsVariables = StorefrontApi.VariablesOf<typeof SAVED_PRODUCTS_QUERY>;

/** Форма фрагмента SavedProductFields. */
export type SavedProductFields = NonNullable<SavedProductsResult["p0"]>;

/** Скільки handle маршрут приймає за раз. */
export const SAVED_PRODUCTS_MAX_HANDLES = SAVED_PRODUCTS_PAGE_SIZE;

export type ParsedHandles = { ok: true; handles: string[] } | { ok: false; error: string };

/**
 * Розбирає параметр `?handles=a,b,c`: до 24 handle через кому, повтори зливаються.
 * Помилка — готовий текст для відповіді 400.
 */
export function parseHandlesParam(value: string | null): ParsedHandles {
  const items = (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length === 0) {
    return { ok: false, error: "Передайте параметр handles: перелік handle товарів через кому." };
  }

  const handles = [...new Set(items)];
  if (handles.length > SAVED_PRODUCTS_MAX_HANDLES) {
    return {
      ok: false,
      error: `Забагато товарів: за один запит можна отримати не більше ${SAVED_PRODUCTS_MAX_HANDLES}.`,
    };
  }
  if (!handles.every(isValidHandle)) {
    return {
      ok: false,
      error: "Некоректний handle: дозволені лише літери, цифри, дефіс і підкреслення.",
    };
  }

  return { ok: true, handles };
}

/** Товар без варіантів має службову опцію Title зі значенням Default Title. */
const DEFAULT_OPTION_VALUE = "Default Title";

/** custom.short_specs — список рядків у JSON; однорядкове поле читаємо порядково. */
export function parseShortSpecs(value: string | null | undefined): string[] {
  if (!value) return [];

  let items: unknown[];
  try {
    const parsed: unknown = JSON.parse(value);
    items = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    items = value.split("\n");
  }

  return items
    .filter((item): item is string | number => typeof item === "string" || typeof item === "number")
    .map((item) => String(item).trim())
    .filter(Boolean);
}

/** Відповідь Storefront API → товар для обраного та порівняння. */
export function toSavedProduct(product: SavedProductFields): SavedProduct {
  return {
    ...toProductCard(product),
    vendor: product.vendor.trim() || null,
    productType: product.productType.trim() || null,
    options: product.options
      .map((option) => ({
        name: option.name,
        values: option.optionValues.map((value) => value.name),
      }))
      .filter(
        (option) =>
          option.values.length > 0 &&
          !(option.values.length === 1 && option.values[0] === DEFAULT_OPTION_VALUE),
      ),
    shortSpecs: parseShortSpecs(product.shortSpecs?.value),
  };
}

type Client = StorefrontGraphqlClient;

/** Один документ SAVED_PRODUCTS_QUERY: до SAVED_PRODUCTS_SLOTS товарів. */
async function loadSlots(storefrontClient: Client, handles: readonly string[]) {
  const variables: Record<string, string | boolean> = {};
  handles.forEach((handle, index) => {
    variables[`h${index}`] = handle;
    variables[`i${index}`] = true;
  });

  // Без кешу: набір handle у кожного відвідувача свій, а ціна й наявність мають бути свіжими.
  const result = await storefrontClient.graphql(SAVED_PRODUCTS_QUERY, {
    variables: variables as SavedProductsVariables,
  });
  const { data } = result;
  // Будь-яка помилка GraphQL — це збій усього запиту, навіть якщо частина товарів прийшла:
  // слот із помилкою теж дорівнює null, і клієнт прибрав би такий товар зі списку як видалений.
  if (logGraphqlErrors("SavedProducts", result) || !data) {
    throw new Error("SavedProducts: Storefront API повернув помилку або відповідь без даних");
  }

  const slots = data as Record<string, SavedProductFields | null | undefined>;
  return handles.flatMap((_, index) => {
    const product = slots[`p${index}`];
    return product ? [toSavedProduct(product)] : [];
  });
}

/**
 * Товари за списком handle, у порядку списку: до 24 handle — це один або два паралельні запити.
 * Товари, яких у магазині вже немає, просто не потрапляють у відповідь.
 * Якщо хоч один запит повернув помилку GraphQL, функція кидає виняток (маршрут відповідає 502).
 */
export async function loadSavedProducts(
  storefrontClient: Client,
  handles: readonly string[],
): Promise<SavedProduct[]> {
  const limited = handles.slice(0, SAVED_PRODUCTS_MAX_HANDLES);
  const pages: string[][] = [];
  for (let start = 0; start < limited.length; start += SAVED_PRODUCTS_SLOTS) {
    pages.push(limited.slice(start, start + SAVED_PRODUCTS_SLOTS));
  }

  const results = await Promise.all(pages.map((page) => loadSlots(storefrontClient, page)));
  return results.flat();
}
