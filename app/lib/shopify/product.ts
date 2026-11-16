import {
  buildProductSelectionSearchParams,
  type SelectedOption,
  type StorefrontApi,
} from "@shopify/hydrogen";

import type { ProductBadge } from "~/components/product/product-card";
import type { ConditionGrade } from "~/components/product/used-grade";
import type { PRODUCT_QUERY } from "~/graphql/queries/product.query";
import type { ProductJsonLdInput } from "~/lib/seo";

/**
 * Чисті хелпери сторінки товару. Тут немає GraphQL-документів (запит імпортується лише як тип),
 * тому файл безпечно імпортувати в компоненти. Запити живуть у load-product.ts.
 */

/** Товар зі сторінки товару: відповідь PRODUCT_QUERY. */
export type ProductPageData = NonNullable<StorefrontApi.ResultOf<typeof PRODUCT_QUERY>["product"]>;
export type ProductPageVariant = NonNullable<ProductPageData["selectedOrFirstAvailableVariant"]>;

export type ProductPageImage = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

/** Дані з метаполів custom.* і колекції, зведені до зручного вигляду. */
export type ProductDetails = {
  badge: ProductBadge | null;
  installmentMonths: number | null;
  /** custom.short_specs: «Дисплей: 6,3″ OLED» або просто «Face ID». */
  shortSpecs: string[];
  used: { grade: ConditionGrade; batteryHealth: number | null } | null;
  /** TODO(реальний магазин): рейтинг із застосунку відгуків. Поки його немає — null. */
  rating: { value: number; count: number } | null;
  /** Перша колекція товару: для хлібних крихт. */
  collection: { handle: string; title: string } | null;
};

const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 155;
const STORE_PITCH = "Доставка по Україні завтра, оплата частинами, гарантія 12 місяців.";

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

/**
 * Значення метаполя-списку. Shopify віддає список як JSON-рядок («["a","b"]»);
 * звичайний текст розбивається за рядками.
 */
export function parseListMetafield(value: string | null | undefined): string[] {
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

/** Чи схоже значення на hex-колір. Воно потрапляє в style, тому перевіряється. */
export function isHexColor(value: string | null | undefined): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

/** «Color», «Colour», «Колір» — опція, яку показуємо кружечками. */
export function isColorOptionName(name: string): boolean {
  return COLOR_OPTION_NAME.test(name);
}

export function toProductDetails(product: ProductPageData): ProductDetails {
  const grade = oneOf(product.conditionGrade?.value, GRADES);
  const collection = product.collections.nodes[0];

  return {
    badge: oneOf(product.badge?.value, BADGES),
    installmentMonths: toInteger(product.installmentMonths?.value),
    shortSpecs: parseListMetafield(product.shortSpecs?.value),
    used: grade ? { grade, batteryHealth: toInteger(product.batteryHealth?.value) } : null,
    rating: null,
    collection: collection ? { handle: collection.handle, title: collection.title } : null,
  };
}

/** Ключ кольору в мапі з productColorSwatches. */
export function swatchKey(optionName: string, valueName: string): string {
  return `${optionName}:${valueName}`;
}

/**
 * Кольори для кружечків вибору. Спершу береться swatch самого значення опції;
 * якщо його немає — hex із custom.color_swatches за порядком значень опції «Колір».
 */
export function productColorSwatches(
  product: Pick<ProductPageData, "options" | "colorSwatches">,
): Map<string, string> {
  const swatches = new Map<string, string>();
  const fallback = parseListMetafield(product.colorSwatches?.value);

  for (const option of product.options) {
    const useFallback = isColorOptionName(option.name);
    option.optionValues.forEach((value, index) => {
      const color = value.swatch?.color ?? (useFallback ? fallback[index] : null);
      if (isHexColor(color)) swatches.set(swatchKey(option.name, value.name), color);
    });
  }

  return swatches;
}

/** Фото для галереї: спершу фото вибраного варіанта, далі решта без повторів. */
export function productGalleryImages(
  product: Pick<ProductPageData, "featuredImage" | "images">,
  selectedVariant?: { image?: ProductPageImage | null } | null,
): ProductPageImage[] {
  const images: ProductPageImage[] = [];
  const seen = new Set<string>();
  const add = (image: ProductPageImage | null | undefined) => {
    if (!image?.url || seen.has(image.url)) return;
    seen.add(image.url);
    images.push(image);
  };

  add(selectedVariant?.image ?? product.featuredImage ?? product.images.nodes[0]);
  for (const image of product.images.nodes) add(image);
  return images;
}

/**
 * Адреса товару з вибраними опціями в параметрах: «/products/iphone?Колір=Синій».
 * Параметри, що не стосуються опцій (?ref=…), зберігаються з base.
 */
export function productVariantUrl(
  product: { handle: string; options: ReadonlyArray<{ name: string }> },
  selectedOptions: SelectedOption[],
  handle: string = product.handle,
  base: URLSearchParams = new URLSearchParams(),
): string {
  const params = buildProductSelectionSearchParams({
    selectedOptions,
    optionNames: product.options.map((option) => option.name),
    base,
  });
  const query = params.toString();
  return `/products/${handle}${query ? `?${query}` : ""}`;
}

function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > limit / 2 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s,.;:—-]+$/, "")}…`;
}

/** <title> до 60 символів: назва товару й, доки вміщається, уточнення про магазин. */
export function productMetaTitle(title: string): string {
  const name = title.trim();
  const candidates = [
    `${name} — купити у Вінниці | Сад`,
    `${name} — купити | Сад`,
    `${name} | Сад`,
  ];
  return (
    candidates.find((candidate) => candidate.length <= TITLE_LIMIT) ?? truncate(name, TITLE_LIMIT)
  );
}

/** Опис для пошуковика, близько 150 символів: SEO-опис товару або початок звичайного. */
export function productMetaDescription(
  product: Pick<ProductPageData, "title" | "description" | "seo">,
): string {
  const text = (product.seo.description ?? product.description ?? "").replace(/\s+/g, " ").trim();
  if (!text) return truncate(`Купити ${product.title} у «Сад». ${STORE_PITCH}`, DESCRIPTION_LIMIT);

  const withPitch = `${text} ${STORE_PITCH}`;
  return withPitch.length <= DESCRIPTION_LIMIT ? withPitch : truncate(text, DESCRIPTION_LIMIT);
}

/** Хлібні крихти сторінки товару: Головна → Каталог → колекція → товар. */
export function productBreadcrumbs(
  product: Pick<ProductPageData, "handle" | "title" | "collections">,
): { title: string; to: string }[] {
  const collection = product.collections.nodes[0];

  return [
    { title: "Головна", to: "/" },
    { title: "Каталог", to: "/collections" },
    ...(collection ? [{ title: collection.title, to: `/collections/${collection.handle}` }] : []),
    { title: product.title, to: `/products/${product.handle}` },
  ];
}

/** Дані для JSON-LD товару: ціна й наявність варіанта, який віддав сервер. */
export function toProductJsonLdInput(product: ProductPageData): ProductJsonLdInput {
  const variant = product.selectedOrFirstAvailableVariant;
  const details = toProductDetails(product);

  return {
    handle: product.handle,
    title: product.title,
    description: product.description,
    images: productGalleryImages(product, variant).map((image) => image.url),
    sku: variant?.sku ?? null,
    brand: product.vendor || null,
    price: variant?.price ?? product.priceRange.minVariantPrice,
    availableForSale: variant ? variant.availableForSale : product.availableForSale,
    used: Boolean(details.used),
    rating: details.rating,
  };
}
