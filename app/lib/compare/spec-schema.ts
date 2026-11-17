/**
 * Схема характеристик для порівняння. Спільна для сайту та скрипта наповнення магазину,
 * тому тут немає імпортів застосунку.
 *
 * Характеристики товару лежать у метаполі `custom.specs` (тип json): плоский об'єкт
 * «ключ → готове до показу значення українською», наприклад
 * `{ "display_size": "6,3″", "chip": "A19 Pro", "weight": "206 г" }`.
 * Назви рядків, групи та порядок задає ця схема, а не дані товару: так таблиця однакова
 * для всіх товарів категорії, а нове поле додається в одному місці.
 */

export type CompareCategoryKey = "iphone" | "mac" | "ipad" | "watch" | "airpods";

export type SpecRow = { key: string; label: string };
export type SpecGroup = { title: string; rows: readonly SpecRow[] };

export type CompareCategory = {
  key: CompareCategoryKey;
  /** Назва вкладки на сторінці порівняння. */
  title: string;
  /** Тип товару в Shopify (`productType`), за яким товар потрапляє в категорію. */
  productType: string;
  groups: readonly SpecGroup[];
};

export const SPECS_METAFIELD = { namespace: "custom", key: "specs" } as const;

export const COMPARE_CATEGORIES: readonly CompareCategory[] = [
  {
    key: "iphone",
    title: "iPhone",
    productType: "Смартфони",
    groups: [
      {
        title: "Екран",
        rows: [
          { key: "display_size", label: "Діагональ" },
          { key: "display_type", label: "Тип екрана" },
          { key: "display_resolution", label: "Роздільна здатність" },
          { key: "display_brightness", label: "Яскравість" },
        ],
      },
      {
        title: "Продуктивність",
        rows: [
          { key: "chip", label: "Чип" },
          { key: "storage", label: "Пам'ять" },
        ],
      },
      {
        title: "Камера",
        rows: [
          { key: "camera_main", label: "Основна камера" },
          { key: "camera_ultrawide", label: "Надширококутна" },
          { key: "camera_tele", label: "Телеоб'єктив" },
          { key: "camera_front", label: "Фронтальна камера" },
          { key: "video", label: "Відео" },
        ],
      },
      {
        title: "Акумулятор",
        rows: [
          { key: "battery", label: "Час роботи" },
          { key: "charging", label: "Заряджання" },
        ],
      },
      {
        title: "Корпус",
        rows: [
          { key: "material", label: "Матеріали" },
          { key: "water", label: "Захист від води" },
          { key: "dimensions", label: "Розміри" },
          { key: "weight", label: "Вага" },
        ],
      },
      {
        title: "Зв'язок",
        rows: [
          { key: "sim", label: "SIM" },
          { key: "wireless", label: "Бездротовий зв'язок" },
          { key: "port", label: "Роз'єм" },
        ],
      },
    ],
  },
  {
    key: "mac",
    title: "Mac",
    productType: "Ноутбуки та комп'ютери",
    groups: [
      {
        title: "Екран",
        rows: [
          { key: "display_size", label: "Діагональ" },
          { key: "display_type", label: "Тип екрана" },
          { key: "display_resolution", label: "Роздільна здатність" },
          { key: "display_brightness", label: "Яскравість" },
        ],
      },
      {
        title: "Продуктивність",
        rows: [
          { key: "chip", label: "Чип" },
          { key: "cpu", label: "Процесор" },
          { key: "gpu", label: "Графіка" },
          { key: "ram", label: "Оперативна пам'ять" },
          { key: "storage", label: "Накопичувач" },
        ],
      },
      {
        title: "Акумулятор",
        rows: [
          { key: "battery", label: "Час роботи" },
          { key: "charging", label: "Заряджання" },
        ],
      },
      {
        title: "Підключення",
        rows: [
          { key: "ports", label: "Роз'єми" },
          { key: "wireless", label: "Бездротовий зв'язок" },
          { key: "external_displays", label: "Зовнішні дисплеї" },
        ],
      },
      {
        title: "Камера і звук",
        rows: [
          { key: "camera_front", label: "Камера" },
          { key: "audio", label: "Звук" },
        ],
      },
      {
        title: "Корпус",
        rows: [
          { key: "keyboard", label: "Клавіатура" },
          { key: "dimensions", label: "Розміри" },
          { key: "weight", label: "Вага" },
        ],
      },
    ],
  },
  {
    key: "ipad",
    title: "iPad",
    productType: "Планшети",
    groups: [
      {
        title: "Екран",
        rows: [
          { key: "display_size", label: "Діагональ" },
          { key: "display_type", label: "Тип екрана" },
          { key: "display_resolution", label: "Роздільна здатність" },
          { key: "display_brightness", label: "Яскравість" },
        ],
      },
      {
        title: "Продуктивність",
        rows: [
          { key: "chip", label: "Чип" },
          { key: "storage", label: "Пам'ять" },
        ],
      },
      {
        title: "Камера",
        rows: [
          { key: "camera_main", label: "Основна камера" },
          { key: "camera_front", label: "Фронтальна камера" },
        ],
      },
      {
        title: "Акумулятор",
        rows: [
          { key: "battery", label: "Час роботи" },
          { key: "charging", label: "Заряджання" },
        ],
      },
      {
        title: "Підключення й аксесуари",
        rows: [
          { key: "port", label: "Роз'єм" },
          { key: "wireless", label: "Бездротовий зв'язок" },
          { key: "cellular", label: "Мобільний зв'язок" },
          { key: "pencil", label: "Apple Pencil" },
          { key: "keyboard", label: "Клавіатура" },
        ],
      },
      {
        title: "Корпус",
        rows: [
          { key: "unlock", label: "Розблокування" },
          { key: "dimensions", label: "Розміри" },
          { key: "weight", label: "Вага" },
        ],
      },
    ],
  },
  {
    key: "watch",
    title: "Watch",
    productType: "Смарт-годинники",
    groups: [
      {
        title: "Корпус і екран",
        rows: [
          { key: "case_size", label: "Розмір корпусу" },
          { key: "material", label: "Матеріал корпусу" },
          { key: "display_type", label: "Екран" },
          { key: "display_brightness", label: "Яскравість" },
          { key: "water", label: "Захист від води" },
          { key: "weight", label: "Вага" },
        ],
      },
      {
        title: "Продуктивність",
        rows: [
          { key: "chip", label: "Чип" },
          { key: "storage", label: "Пам'ять" },
        ],
      },
      {
        title: "Здоров'я і спорт",
        rows: [
          { key: "health", label: "Датчики здоров'я" },
          { key: "safety", label: "Безпека" },
          { key: "gps", label: "GPS" },
        ],
      },
      {
        title: "Акумулятор",
        rows: [
          { key: "battery", label: "Час роботи" },
          { key: "charging", label: "Заряджання" },
        ],
      },
      {
        title: "Зв'язок",
        rows: [
          { key: "cellular", label: "Мобільний зв'язок" },
          { key: "wireless", label: "Бездротовий зв'язок" },
        ],
      },
    ],
  },
  {
    key: "airpods",
    title: "AirPods",
    productType: "Навушники",
    groups: [
      {
        title: "Звук",
        rows: [
          { key: "form", label: "Тип" },
          { key: "anc", label: "Шумопоглинання" },
          { key: "transparency", label: "Режим прозорості" },
          { key: "spatial_audio", label: "Просторове аудіо" },
          { key: "chip", label: "Чип" },
        ],
      },
      {
        title: "Акумулятор",
        rows: [
          { key: "battery", label: "Час роботи навушників" },
          { key: "battery_case", label: "З футляром" },
          { key: "charging", label: "Заряджання футляра" },
        ],
      },
      {
        title: "Корпус",
        rows: [
          { key: "health", label: "Датчики" },
          { key: "water", label: "Захист від води й поту" },
          { key: "controls", label: "Керування" },
          { key: "weight", label: "Вага" },
        ],
      },
    ],
  },
];

/** Категорія порівняння за типом товару; null — товар не порівнюється (аксесуари). */
export function compareCategoryOf(productType: string | null | undefined): CompareCategory | null {
  if (!productType) return null;
  return COMPARE_CATEGORIES.find((category) => category.productType === productType) ?? null;
}

/** Ключі характеристик категорії в порядку схеми. */
export function specKeysOf(category: CompareCategory): string[] {
  return category.groups.flatMap((group) => group.rows.map((row) => row.key));
}

/** Метаполе `custom.specs` → об'єкт рядків. Зіпсований чи порожній JSON дає порожній об'єкт. */
export function parseSpecs(value: string | null | undefined): Record<string, string> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).flatMap(([key, item]) =>
        typeof item === "string" && item.trim() ? [[key, item.trim()]] : [],
      ),
    );
  } catch {
    return {};
  }
}
