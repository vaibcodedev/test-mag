/**
 * Маніфест фото товарів: звідки взято кожне зображення і на яких умовах.
 *
 * Самі дані лежать у scripts/seed-images.json (файл зібрано скриптом, руками його зручно
 * лише доповнювати). Тут — типи й читання. Із маніфесту будується docs/image-credits.md:
 *   node --experimental-strip-types scripts/seed-credits.ts
 *
 * УВАГА. Зображення з ліцензією `apple-test-only` — офіційні фото Apple, узяті для
 * закритого тестового магазину за рішенням власника. У публічний магазин вони потрапляти
 * не повинні: перед запуском їх замінюють пакетом зображень від Apple або дистриб'ютора.
 * Прибрати їх усі одразу: `npm run seed -- --strip-test-images`.
 * У самому магазині жодних позначок про це немає — облік ведеться лише тут.
 */
import { readFileSync } from "node:fs";

/** Ліцензія, з якою фото можна лишати в публічному магазині, або позначка «лише для тесту». */
export const TEST_ONLY_LICENCE = "apple-test-only";

export type ImageSource = {
  /** Сталий ключ зображення в маніфесті. */
  id: string;
  /** Пряма адреса файлу, яку Shopify копіює до себе. */
  url: string;
  /** Що видно на фото — українською; у межах одного товару не повторюється. */
  alt: string;
  source: string;
  /** Сторінка, де зображення опубліковано. */
  sourcePage: string;
  author: string;
  licence: string;
  width?: number;
  height?: number;
};

export type ProductMedia = {
  /** Ключі зображень у порядку показу; перше — головне фото. */
  gallery: string[];
  /** Значення опції «Колір» → ключ фото товару в цьому кольорі. */
  colors?: Record<string, string>;
  /** Офіційне відео Apple на YouTube. */
  video?: string;
};

export type ImageManifest = {
  images: ImageSource[];
  /** Handle товару із seed-catalog.ts → його фото. */
  products: Record<string, ProductMedia>;
};

export const IMAGE_MANIFEST: ImageManifest = JSON.parse(
  readFileSync(new URL("./seed-images.json", import.meta.url), "utf8"),
) as ImageManifest;
