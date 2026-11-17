/**
 * Які фото й відео має отримати кожен товар. Чисті функції над каталогом і маніфестом
 * зображень — без мережі, тож перевіряються тестами (scripts/seed-catalog.test.ts).
 */
import { CATEGORIES, colorValues, type CategoryKey, type ProductSeed } from "./seed-catalog.ts";
import { TEST_ONLY_LICENCE, type ImageManifest, type ImageSource } from "./seed-images.ts";

export type MediaType = "IMAGE" | "EXTERNAL_VIDEO" | "VIDEO";

export type MediaItem = {
  type: MediaType;
  url: string;
  /** Підпис. За ним скрипт упізнає вже завантажений файл товару, тому в товарі він унікальний. */
  alt: string;
  /** Зображення лише для тестового магазину (див. seed-images.ts). */
  testOnly: boolean;
  /** Значення опції «Колір», варіанти з яким показують це фото. */
  colors: string[];
};

/** Storefront читає перші 20 медіа товару; лишаємо запас на відео. */
export const MAX_IMAGES_PER_PRODUCT = 12;

/** Товар із власним відеофайлом у галереї — щоб було на чому перевірити програвач. */
export const SHOWCASE_HANDLE = "iphone-17-pro";

/**
 * Відеофайл для товару-вітрини: 10 секунд «Big Buck Bunny» (Blender Foundation, CC BY 3.0),
 * близько 1 МБ. Скрипт завантажує файл і передає його в Shopify.
 */
export const SHOWCASE_VIDEO_URL =
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4";

const MOCK_MEDIA =
  "https://cdn.shopify.com/mock-shop-production-media/_image_studio/ea62fe2c-4ccf-4787-9cf0-dbfa4a4f2747";

/**
 * Запасні фото категорій із публічного демо-каталогу mock.shop. Потрапляють у товар лише
 * тоді, коли в маніфесті для нього немає жодного зображення (або всі прибрано прапорцем
 * `--strip-test-images`), щоб картка не лишилася порожньою.
 */
export const PLACEHOLDER_IMAGES: Record<CategoryKey, string> = {
  iphone: `${MOCK_MEDIA}/2c9dfe14599dfdf016b15700528a30f9822ad13cb9e2095ad6000685fa06a18a.png`,
  mac: `${MOCK_MEDIA}/c49583e8723152603f72ad28dcca1d4ec9f5d89305abeec15cb609593f3e6d1e.png`,
  ipad: `${MOCK_MEDIA}/c49583e8723152603f72ad28dcca1d4ec9f5d89305abeec15cb609593f3e6d1e.png`,
  watch: `${MOCK_MEDIA}/67830b8beefa80ecc47c1664cad1f86de52c5c5461ba5e0a5754cdcf726ad900.png`,
  airpods: `${MOCK_MEDIA}/358d3ff45f4d76d9dd474f5cae4e019d3a2394c05c470f733ceacb79c58c6d7d.png`,
  accessories: `${MOCK_MEDIA}/8e912450fd4796b0778479a3d6ab60f1b5f48124fad6dc97e3870c02360e4e7c.png`,
};

export type MediaPlanOptions = {
  /** Не брати зображення з ліцензією «лише для тесту». */
  stripTestImages?: boolean;
};

export function isTestOnly(image: Pick<ImageSource, "licence">): boolean {
  return image.licence === TEST_ONLY_LICENCE;
}

function placeholder(seed: ProductSeed): MediaItem {
  return {
    type: "IMAGE",
    url: PLACEHOLDER_IMAGES[seed.category],
    alt: `${CATEGORIES[seed.category].productType}: фото категорії`,
    testOnly: false,
    colors: [],
  };
}

/**
 * Медіа товару в порядку показу: головне фото, решта галереї, фото кольорів, яких у галереї
 * немає, і наприкінці відео. Фото кольорів не відкидаються, коли зображень понад ліміт:
 * коротшає хвіст галереї.
 */
export function productMediaPlan(
  seed: ProductSeed,
  manifest: ImageManifest,
  options: MediaPlanOptions = {},
): MediaItem[] {
  const images = new Map(manifest.images.map((image) => [image.id, image]));
  const media = manifest.products[seed.handle];
  const allowed = (id: string): ImageSource | undefined => {
    const image = images.get(id);
    return image && !(options.stripTestImages && isTestOnly(image)) ? image : undefined;
  };

  const known = new Set(colorValues(seed));
  const colorsOf = new Map<string, string[]>();
  for (const [color, id] of Object.entries(media?.colors ?? {})) {
    if (!known.has(color) || !allowed(id)) continue;
    colorsOf.set(id, [...(colorsOf.get(id) ?? []), color]);
  }

  const gallery = [...new Set(media?.gallery ?? [])].filter((id) => allowed(id));
  const extra = [...colorsOf.keys()].filter((id) => !gallery.includes(id));
  const ids = [
    ...gallery.slice(0, Math.max(MAX_IMAGES_PER_PRODUCT - extra.length, 1)),
    ...extra,
  ].slice(0, MAX_IMAGES_PER_PRODUCT);

  const items: MediaItem[] = ids.flatMap((id) => {
    const image = allowed(id);
    return image
      ? [
          {
            type: "IMAGE" as const,
            url: image.url,
            alt: image.alt,
            testOnly: isTestOnly(image),
            colors: colorsOf.get(id) ?? [],
          },
        ]
      : [];
  });
  if (items.length === 0) items.push(placeholder(seed));

  if (media?.video) {
    items.push({
      type: "EXTERNAL_VIDEO",
      url: media.video,
      alt: `${seed.title}: відео Apple`,
      testOnly: false,
      colors: [],
    });
  }
  if (seed.handle === SHOWCASE_HANDLE) {
    items.push({
      type: "VIDEO",
      url: SHOWCASE_VIDEO_URL,
      alt: `${seed.title}: відео`,
      testOnly: false,
      colors: [],
    });
  }
  return items;
}

/** Підпис фото, яке має показувати варіант із такими значеннями опцій. */
export function variantMediaAlt(
  plan: MediaItem[],
  variantOptions: readonly string[],
): string | null {
  return (
    plan.find((item) => item.colors.some((color) => variantOptions.includes(color)))?.alt ?? null
  );
}

/**
 * Які медіа товару прибирає `--strip-test-images`: ті, чий підпис збігається з підписом
 * зображення «лише для тесту», призначеного цьому товару в маніфесті. Позначок у магазині
 * немає, тому впізнаємо саме так; чужі фото власника з іншими підписами не зачіпаються.
 */
export function mediaToStrip<T extends { alt: string | null }>(
  seed: ProductSeed,
  manifest: ImageManifest,
  current: T[],
): T[] {
  const testAlts = new Set(
    productMediaPlan(seed, manifest)
      .filter((item) => item.testOnly)
      .map((item) => item.alt),
  );
  return current.filter((item) => item.alt !== null && testAlts.has(item.alt));
}

/** Помилки в маніфесті; порожній список — усе гаразд. */
export function validateMedia(products: ProductSeed[], manifest: ImageManifest): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const urls = new Set<string>();
  for (const image of manifest.images) {
    if (ids.has(image.id)) errors.push(`Зображення «${image.id}» повторюється.`);
    if (urls.has(image.url)) errors.push(`Адреса зображення «${image.id}» повторюється.`);
    ids.add(image.id);
    urls.add(image.url);
    if (!/^https:\/\//.test(image.url)) errors.push(`Зображення «${image.id}»: адреса не https.`);
    if (!image.alt.trim()) errors.push(`Зображення «${image.id}» без підпису.`);
    if (!image.sourcePage || !image.author || !image.licence) {
      errors.push(`Зображення «${image.id}»: немає джерела, автора або ліцензії.`);
    }
  }

  const handles = new Set(products.map((item) => item.handle));
  for (const [handle, media] of Object.entries(manifest.products)) {
    if (!handles.has(handle)) errors.push(`Фото для товару «${handle}», якого немає в каталозі.`);
    for (const id of [...media.gallery, ...Object.values(media.colors ?? {})]) {
      if (!ids.has(id)) errors.push(`Товар «${handle}»: немає зображення «${id}».`);
    }
  }

  for (const seed of products) {
    const plan = productMediaPlan(seed, manifest);
    const alts = plan.map((item) => item.alt);
    if (new Set(alts).size !== alts.length) {
      errors.push(`Товар «${seed.handle}»: підписи медіа повторюються.`);
    }
    const colors = new Set(colorValues(seed));
    for (const color of Object.keys(manifest.products[seed.handle]?.colors ?? {})) {
      if (!colors.has(color)) errors.push(`Товар «${seed.handle}»: немає кольору «${color}».`);
    }
  }
  return errors;
}

/* ------------------------------------------------------------------ */
/* docs/image-credits.md                                               */
/* ------------------------------------------------------------------ */

/** Текст docs/image-credits.md: кожне зображення з джерелом, автором і ліцензією. */
export function creditsMarkdown(products: ProductSeed[], manifest: ImageManifest): string {
  const usedBy = new Map<string, string[]>();
  for (const seed of products) {
    const media = manifest.products[seed.handle];
    for (const id of new Set([...(media?.gallery ?? []), ...Object.values(media?.colors ?? {})])) {
      usedBy.set(id, [...(usedBy.get(id) ?? []), seed.handle]);
    }
  }
  // Список, а не таблиця: Prettier вирівнює таблиці пробілами, і файл розростається в рази.
  const table = (images: ImageSource[]): string[] =>
    images.map(
      (image) =>
        `- «${image.alt}» — товари: ${(usedBy.get(image.id) ?? []).join(", ")} — ${image.author}, ${image.licence} — [${image.source}](${image.sourcePage}) · [файл](${image.url})`,
    );

  const testOnly = manifest.images.filter(isTestOnly);
  const free = manifest.images.filter((image) => !isTestOnly(image));
  return [
    "# Джерела зображень товарів",
    "",
    "Файл згенеровано з `scripts/seed-images.json` командою",
    "`node --experimental-strip-types scripts/seed-credits.ts`. Руками не редагувати.",
    "",
    `Усього зображень: ${manifest.images.length}. Із вільною ліцензією: ${free.length}. Лише для тестового магазину: ${testOnly.length}.`,
    "",
    "## Зображення з вільною ліцензією",
    "",
    "Їх можна лишати в публічному магазині за умов ліцензії (для CC BY / CC BY-SA — із зазначенням автора).",
    "",
    ...table(free),
    "",
    "## Офіційні зображення Apple — ЛИШЕ для тестового магазину",
    "",
    "Ліцензія в маніфесті: `apple-test-only`. Це зображення з apple.com та Apple Newsroom, права на які",
    "належать Apple Inc. Їх використано в закритому тестовому магазині за рішенням власника.",
    "**У публічний магазин вони потрапляти не повинні:** перед запуском їх треба замінити пакетом",
    "зображень, який авторизовані продавці отримують від Apple або дистриб'ютора.",
    "",
    "Прибрати всі такі зображення з магазину однією командою: `npm run seed -- --strip-test-images`.",
    "",
    ...table(testOnly),
    "",
    "## Запасні фото категорій",
    "",
    "Товар без жодного зображення в маніфесті отримує загальне фото своєї категорії з публічного",
    "демо-каталогу [mock.shop](https://mock.shop) (`PLACEHOLDER_IMAGES` у `scripts/seed-media.ts`).",
    "Ті самі фото стоять у трьох демо-статтях блогу.",
    "",
    "## Відео",
    "",
    "Відео в галереях — вбудовані ролики з офіційного каналу Apple на YouTube (файли не копіюються).",
    "У товару `iphone-17-pro` є ще власний відеофайл для перевірки програвача: 10 секунд",
    "«Big Buck Bunny», © Blender Foundation, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).",
    "",
  ].join("\n");
}
