export type ShopifyImageOptions = {
  width?: number;
  height?: number;
  crop?: "center" | "top" | "bottom" | "left" | "right";
};

const SHOPIFY_CDN_HOSTS = ["cdn.shopify.com", "mock.shop"];

function isShopifyImageHost(hostname: string) {
  return SHOPIFY_CDN_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

/** Додає параметри розміру до URL із Shopify CDN; сторонні адреси не чіпає. */
export function shopifyImageUrl(url: string, options: ShopifyImageOptions = {}): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (!isShopifyImageHost(parsed.hostname)) return url;

  if (options.width) parsed.searchParams.set("width", String(options.width));
  if (options.height) parsed.searchParams.set("height", String(options.height));
  if (options.crop) parsed.searchParams.set("crop", options.crop);

  return parsed.toString();
}

/** srcset із дескрипторами ширини; для сторонніх адрес повертає undefined. */
export function shopifySrcSet(url: string, widths: readonly number[]): string | undefined {
  const candidates = widths.map((width) => ({ width, href: shopifyImageUrl(url, { width }) }));
  if (candidates.every((candidate) => candidate.href === url)) return undefined;
  return candidates.map((candidate) => `${candidate.href} ${candidate.width}w`).join(", ");
}
