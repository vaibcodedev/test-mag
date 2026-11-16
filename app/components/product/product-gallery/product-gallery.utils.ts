import type { ProductMedia, ProductPageImage } from "~/lib/shopify/product";

type Box = Pick<DOMRect, "left" | "right" | "top" | "bottom">;

const KIND: Record<ProductMedia["type"], string> = {
  image: "Фото",
  video: "Відео",
  "external-video": "Відео",
  model: "3D-модель",
};

/** «Фото 3 з 12», «Відео 4 з 12»: назва слайда й текст для читача екрана. */
export function slideLabel(media: ProductMedia, index: number, count: number): string {
  return `${KIND[media.type]} ${index + 1} з ${count}`;
}

/** Назва мініатюри: «Фото 3 з 12: вигляд збоку», «Відео 4 з 12: огляд камери». */
export function mediaLabel(
  media: ProductMedia,
  index: number,
  count: number,
  title: string,
): string {
  const text = media.type === "image" ? media.image.altText || media.alt : media.alt || title;
  const label = slideLabel(media, index, count);
  return text ? `${label}: ${text}` : label;
}

/** Картинка для мініатюри: саме фото або обкладинка відео чи моделі. */
export function mediaPreview(media: ProductMedia): ProductPageImage | null {
  return media.type === "image" ? media.image : media.poster;
}

function axisDelta(
  containerStart: number,
  containerEnd: number,
  itemStart: number,
  itemEnd: number,
  margin: number,
): number {
  // Стрічка ще не має розміру (прихована або не намальована) — рухати нічого.
  if (containerEnd - containerStart <= 0) return 0;
  if (itemStart - margin < containerStart) return itemStart - margin - containerStart;
  if (itemEnd + margin > containerEnd) return itemEnd + margin - containerEnd;
  return 0;
}

/**
 * На скільки прокрутити стрічку, щоб елемент було видно цілком і з запасом margin.
 * Рахується від рамок на екрані, тож рухається лише сама стрічка, а не сторінка
 * (на відміну від scrollIntoView).
 */
export function scrollDeltaToReveal(
  container: Box,
  item: Box,
  margin = 0,
): { left: number; top: number } {
  return {
    left: axisDelta(container.left, container.right, item.left, item.right, margin),
    top: axisDelta(container.top, container.bottom, item.top, item.bottom, margin),
  };
}
