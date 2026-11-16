import { demoImage } from "~/components/home/home.fixtures";
import type { ProductMedia } from "~/lib/shopify/product";

/**
 * Демо-медіа лише для історій Storybook і тестів. На сайті галерея отримує медіа товару
 * з loader маршруту (productGalleryMedia).
 */

/** Відкритий зразок відео (CC0) з прикладів MDN. */
export const DEMO_VIDEO_URL =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

export function demoPhoto(index: number, alt: string | null = null): ProductMedia {
  return {
    type: "image",
    id: `demo-image-${index}`,
    alt,
    image: { ...demoImage(index), altText: alt },
  };
}

/** Скільки завгодно фото: демо-фото повторюються по колу. */
export function demoPhotos(count: number): ProductMedia[] {
  return Array.from({ length: count }, (_, index) => demoPhoto(index));
}

export const DEMO_VIDEO: Extract<ProductMedia, { type: "video" }> = {
  type: "video",
  id: "demo-video",
  alt: "Огляд камери",
  poster: demoImage(1),
  sources: [
    { url: "https://cdn.shopify.com/videos/demo/master.m3u8", mimeType: "application/x-mpegURL" },
    { url: DEMO_VIDEO_URL, mimeType: "video/mp4", width: 960, height: 540 },
  ],
};

export const DEMO_YOUTUBE: Extract<ProductMedia, { type: "external-video" }> = {
  type: "external-video",
  id: "demo-youtube",
  alt: "Розпакування",
  poster: demoImage(2),
  host: "youtube",
  embedUrl: "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",
  originUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
};

export const DEMO_MODEL: Extract<ProductMedia, { type: "model" }> = {
  type: "model",
  id: "demo-model",
  alt: "Модель корпусу",
  poster: demoImage(3),
  sources: [
    {
      url: "https://modelviewer.dev/shared-assets/models/Astronaut.usdz",
      mimeType: "model/vnd.usdz+zip",
      format: "usdz",
    },
    {
      url: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
      mimeType: "model/gltf-binary",
      format: "glb",
    },
  ],
};

/** Фото, відео Shopify, відео з YouTube і 3D-модель в одній галереї. */
export const DEMO_MIXED_MEDIA: ProductMedia[] = [
  demoPhoto(0, "iPhone 17 Pro спереду"),
  DEMO_VIDEO,
  demoPhoto(4),
  DEMO_YOUTUBE,
  DEMO_MODEL,
];
