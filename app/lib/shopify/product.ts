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

/** Вузол media з відповіді PRODUCT_QUERY: MediaImage, Video, ExternalVideo або Model3d. */
export type ProductPageMediaNode = ProductPageData["media"]["nodes"][number];

export type ProductVideoSource = {
  url: string;
  /** «video/mp4» або «application/x-mpegURL» (HLS). */
  mimeType: string;
  width?: number | null;
  height?: number | null;
};

export type ProductModelSource = {
  url: string;
  mimeType: string;
  /** «glb» або «usdz». */
  format: string;
};

type ProductMediaBase = {
  id: string;
  /** Опис медіа з адмінки Shopify. */
  alt: string | null;
};

/** Елемент галереї товару. */
export type ProductMedia =
  | (ProductMediaBase & { type: "image"; image: ProductPageImage })
  | (ProductMediaBase & {
      type: "video";
      /** Обкладинка; Shopify може ще не встигнути її згенерувати. */
      poster: ProductPageImage | null;
      /** Джерела в порядку для <source>: див. sortVideoSources. */
      sources: ProductVideoSource[];
    })
  | (ProductMediaBase & {
      type: "external-video";
      poster: ProductPageImage | null;
      host: "youtube" | "vimeo";
      /** Адреса плеєра для <iframe>, без параметрів автозапуску. */
      embedUrl: string;
      /** Сторінка відео на YouTube чи Vimeo. */
      originUrl: string;
    })
  | (ProductMediaBase & {
      type: "model";
      poster: ProductPageImage | null;
      sources: ProductModelSource[];
    });

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

const MP4_MIME = "video/mp4";
const HLS_MIME = /mpegurl/i;
const VIDEO_MAX_HEIGHT = 1080;
const YOUTUBE_ID = /^[\w-]{6,20}$/;
const YOUTUBE_PATHS = new Set(["embed", "shorts", "live", "v"]);
const VIMEO_ID = /^\d{4,}$/;
const VIMEO_KEY = /^[0-9a-f]{6,}$/i;

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

function toImage(image: ProductPageImage | null | undefined): ProductPageImage | null {
  if (!image?.url) return null;
  return {
    url: image.url,
    altText: image.altText ?? null,
    width: image.width ?? null,
    height: image.height ?? null,
  };
}

function parseUrl(value: string | null | undefined): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function youtubeVideoId(url: URL): string | null {
  const host = url.hostname.replace(/^(?:www|m)\./, "");
  const [first, second] = url.pathname.split("/").filter(Boolean);
  let id: string | null | undefined = null;

  if (host === "youtu.be") id = first;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id =
      first === "watch"
        ? url.searchParams.get("v")
        : YOUTUBE_PATHS.has(first ?? "")
          ? second
          : null;
  }

  return id && YOUTUBE_ID.test(id) ? id : null;
}

function vimeoEmbedUrl(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;

  const parts = url.pathname.split("/").filter(Boolean);
  const index = parts.findIndex((part) => VIMEO_ID.test(part));
  const id = parts[index];
  if (!id) return null;

  // Відео «за посиланням» має ще й ключ: vimeo.com/<id>/<ключ> або ?h=<ключ>.
  const key = url.searchParams.get("h") ?? parts[index + 1];
  const embed = new URL(`https://player.vimeo.com/video/${id}`);
  if (key && VIMEO_KEY.test(key)) embed.searchParams.set("h", key);
  return embed.toString();
}

/**
 * Адреса плеєра для <iframe>: лише https і лише хости, дозволені в Content-Security-Policy.
 * YouTube вбудовується через youtube-nocookie.com: до натискання «Відтворити» cookie не ставляться.
 * Невідома адреса — null, таке відео в галерею не потрапляє.
 */
export function externalVideoEmbedUrl(
  host: string,
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const candidate of candidates) {
    const url = parseUrl(candidate);
    if (url?.protocol !== "https:") continue;

    if (host === "YOUTUBE") {
      const id = youtubeVideoId(url);
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
    } else if (host === "VIMEO") {
      const embed = vimeoEmbedUrl(url);
      if (embed) return embed;
    }
  }

  return null;
}

function videoSourceRank(source: ProductVideoSource): number {
  if (HLS_MIME.test(source.mimeType)) return 0;
  return source.mimeType === MP4_MIME ? 1 : 2;
}

/**
 * Порядок <source>: спершу HLS (сам підбирає якість; хто не вміє — пропустить),
 * далі MP4 від найбільшого, що не перевищує 1080p. Браузер бере перше джерело, яке може відтворити.
 */
export function sortVideoSources(sources: readonly ProductVideoSource[]): ProductVideoSource[] {
  const oversized = (source: ProductVideoSource) =>
    (source.height ?? 0) > VIDEO_MAX_HEIGHT ? 1 : 0;

  return [...sources].sort(
    (a, b) =>
      videoSourceRank(a) - videoSourceRank(b) ||
      oversized(a) - oversized(b) ||
      (b.height ?? 0) - (a.height ?? 0),
  );
}

/** Вузол media зі Storefront API → елемент галереї. Без того, що можна показати, — null. */
export function toProductMedia(node: ProductPageMediaNode): ProductMedia | null {
  const poster = toImage(node.previewImage);
  const base = { id: node.id, alt: node.alt?.trim() || poster?.altText?.trim() || null };

  switch (node.__typename) {
    case "MediaImage": {
      const image = toImage(node.image) ?? poster;
      return image ? { ...base, type: "image", image } : null;
    }
    case "Video": {
      const sources = sortVideoSources(
        node.sources
          .filter((source) => parseUrl(source.url)?.protocol === "https:")
          .map(({ url, mimeType, width, height }) => ({ url, mimeType, width, height })),
      );
      return sources.length > 0 ? { ...base, type: "video", poster, sources } : null;
    }
    case "ExternalVideo": {
      const embedUrl = externalVideoEmbedUrl(node.host, node.embedUrl, node.originUrl);
      if (!embedUrl) return null;
      return {
        ...base,
        type: "external-video",
        poster,
        host: node.host === "VIMEO" ? "vimeo" : "youtube",
        embedUrl,
        originUrl: node.originUrl,
      };
    }
    case "Model3d": {
      const sources = node.sources
        .filter((source) => parseUrl(source.url)?.protocol === "https:")
        .map(({ url, mimeType, format }) => ({ url, mimeType, format }));
      return sources.length > 0 ? { ...base, type: "model", poster, sources } : null;
    }
    default:
      return null;
  }
}

/**
 * Медіа для галереї в порядку з адмінки Shopify. Першим завжди йде фото вибраного варіанта
 * (без варіанта — головне фото товару); одне й те саме фото двічі не показується.
 */
export function productGalleryMedia(
  product: Pick<ProductPageData, "featuredImage" | "media">,
  selectedVariant?: { image?: ProductPageImage | null } | null,
): ProductMedia[] {
  const seen = new Set<string>();
  const items = product.media.nodes
    .map(toProductMedia)
    .filter((item): item is ProductMedia => item !== null)
    .filter((item) => {
      if (item.type !== "image") return true;
      if (seen.has(item.image.url)) return false;
      seen.add(item.image.url);
      return true;
    });

  const lead = toImage(selectedVariant?.image ?? product.featuredImage);
  if (!lead) return items;

  const index = items.findIndex((item) => item.type === "image" && item.image.url === lead.url);
  const found = items[index];
  if (!found) {
    // Фото варіанта немає серед перших медіа товару: додаємо його окремим елементом.
    return [
      { type: "image", id: `image:${lead.url}`, alt: lead.altText ?? null, image: lead },
      ...items,
    ];
  }

  return index === 0 ? items : [found, ...items.slice(0, index), ...items.slice(index + 1)];
}

/** Лише фото з галереї, у тому самому порядку: для JSON-LD і там, де відео не потрібне. */
export function productGalleryImages(
  product: Pick<ProductPageData, "featuredImage" | "media">,
  selectedVariant?: { image?: ProductPageImage | null } | null,
): ProductPageImage[] {
  return productGalleryMedia(product, selectedVariant).flatMap((item) =>
    item.type === "image" ? [item.image] : [],
  );
}

/** Перше відео товару, яке можна описати в розмітці: потрібна обкладинка. */
function firstVideoWithPoster(media: readonly ProductMedia[]) {
  for (const item of media) {
    if ((item.type === "video" || item.type === "external-video") && item.poster) {
      return { item, poster: item.poster };
    }
  }
  return null;
}

/** Пряме посилання на MP4 для og:video. Відео з YouTube чи Vimeo прямої адреси не мають. */
export function productOgVideo(
  product: Pick<ProductPageData, "featuredImage" | "media">,
): ProductVideoSource | null {
  for (const item of productGalleryMedia(product)) {
    if (item.type !== "video") continue;
    const mp4 = item.sources.find((source) => source.mimeType === MP4_MIME);
    if (mp4) return mp4;
  }
  return null;
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
    `${name} — купити у Вінниці | Ionov Store`,
    `${name} — купити | Ionov Store`,
    `${name} | Ionov Store`,
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
  if (!text)
    return truncate(`Купити ${product.title} в Ionov Store. ${STORE_PITCH}`, DESCRIPTION_LIMIT);

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
  const media = productGalleryMedia(product, variant);
  const video = firstVideoWithPoster(media);

  return {
    handle: product.handle,
    title: product.title,
    description: product.description,
    images: media.flatMap((item) => (item.type === "image" ? [item.image.url] : [])),
    video: video
      ? {
          name: video.item.alt || product.title,
          thumbnailUrl: video.poster.url,
          ...(video.item.type === "video"
            ? {
                contentUrl: (
                  video.item.sources.find((source) => source.mimeType === MP4_MIME) ??
                  video.item.sources[0]
                )?.url,
              }
            : { embedUrl: video.item.embedUrl }),
        }
      : null,
    sku: variant?.sku ?? null,
    brand: product.vendor || null,
    price: variant?.price ?? product.priceRange.minVariantPrice,
    availableForSale: variant ? variant.availableForSale : product.availableForSale,
    used: Boolean(details.used),
    rating: details.rating,
  };
}
