import type { StorefrontApi } from "@shopify/hydrogen";

import type { ColorSwatch } from "~/components/product/color-swatches";
import type { ProductBadge, ProductCardData } from "~/components/product/product-card";
import type { ConditionGrade } from "~/components/product/used-grade";
import type { HOME_PRODUCTS_QUERY } from "~/graphql/queries/home.query";
import { compareCategoryOf } from "~/lib/compare/spec-schema";

/** Форма фрагмента ProductCardFields. Тип виводиться із запиту: сам фрагмент gql.tada маскує. */
export type ProductCardFields = StorefrontApi.ResultOf<
  typeof HOME_PRODUCTS_QUERY
>["products"]["nodes"][number];

const BADGES: readonly ProductBadge[] = ["Новинка", "Хіт", "Топ"];
const GRADES: readonly ConditionGrade[] = ["Як новий", "Відмінний", "Хороший"];
const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const COLOR_OPTION_NAME = /colou?r|кол[іь]р|цвет/i;

function oneOf<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
): T | null {
  return allowed.find((item) => item === value) ?? null;
}

function toInteger(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Значення метаполя-списку: Shopify віддає його JSON-рядком («["#41444b"]»). */
function parseList(value: string | null | undefined): unknown[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Кольори товару для кружечків у картці: значення опції «Колір» у порядку з магазину.
 * Колір береться зі swatch значення опції, а якщо його немає — з custom.color_swatches
 * за тим самим порядком. Значення без коректного hex пропускається: hex потрапляє в style.
 */
export function toCardColors(
  product: Partial<Pick<ProductCardFields, "cardOptions" | "cardColorSwatches">>,
): ColorSwatch[] {
  const option = (product.cardOptions ?? []).find((item) => COLOR_OPTION_NAME.test(item.name));
  if (!option) return [];

  const fallback = parseList(product.cardColorSwatches?.value);
  const colors: ColorSwatch[] = [];

  option.optionValues.forEach((value, index) => {
    const hex: unknown = value.swatch?.color ?? fallback[index];
    if (typeof hex === "string" && HEX_COLOR.test(hex)) colors.push({ name: value.name, hex });
  });

  return colors;
}

/**
 * Ціна, стара ціна й варіант картки — з одного джерела, `selectedOrFirstAvailableVariant`:
 * «Купити» кладе в кошик той варіант, ціну якого бачить покупець.
 *
 * Якщо варіанти товару коштують по-різному, одна ціна на картці була б неправдою: показуємо
 * «від» + найменшу ціну, а кнопка веде на сторінку товару (`variantId: null`).
 */
export function toCardPricing(
  product: Pick<ProductCardFields, "priceRange" | "selectedOrFirstAvailableVariant">,
): Pick<ProductCardData, "variantId" | "price" | "compareAtPrice" | "priceFrom"> {
  const { minVariantPrice, maxVariantPrice } = product.priceRange;
  const variant = product.selectedOrFirstAvailableVariant;
  const priceFrom =
    Number.parseFloat(maxVariantPrice.amount) > Number.parseFloat(minVariantPrice.amount);

  if (priceFrom || !variant) {
    // Найдешевший варіант зі знижкою: «від 62 999 ₴» показуємо разом зі старою ціною саме
    // цього варіанта. Якщо найдешевший — інший варіант, старої ціни не вигадуємо.
    const cheapest =
      variant &&
      Number.parseFloat(variant.price.amount) === Number.parseFloat(minVariantPrice.amount)
        ? variant
        : null;
    const compareAt = cheapest?.compareAtPrice;
    return {
      variantId: null,
      price: minVariantPrice,
      compareAtPrice:
        compareAt && Number.parseFloat(compareAt.amount) > Number.parseFloat(minVariantPrice.amount)
          ? compareAt
          : null,
      priceFrom,
    };
  }

  const compareAt = variant.compareAtPrice;
  return {
    variantId: variant.availableForSale ? variant.id : null,
    price: variant.price,
    compareAtPrice:
      compareAt && Number.parseFloat(compareAt.amount) > Number.parseFloat(variant.price.amount)
        ? compareAt
        : null,
    priceFrom: false,
  };
}

/** Відповідь Storefront API → дані картки товару. */
export function toProductCard(product: ProductCardFields): ProductCardData {
  const grade = oneOf(product.conditionGrade?.value, GRADES);
  const colors = toCardColors(product);

  return {
    handle: product.handle,
    ...toCardPricing(product),
    title: product.title,
    image: product.featuredImage,
    availableForSale: product.availableForSale,
    badge: oneOf(product.badge?.value, BADGES),
    installmentMonths: toInteger(product.installmentMonths?.value),
    colors: colors.length > 0 ? colors : undefined,
    compareCategory: compareCategoryOf(product.productType)?.key ?? null,
    used: grade ? { grade, batteryHealth: toInteger(product.batteryHealth?.value) } : null,
    // TODO(реальний магазин): рейтинг із застосунку відгуків і дата доставки з налаштувань.
    rating: null,
    delivery: product.availableForSale ? "доставимо завтра" : null,
  };
}
