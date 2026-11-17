import { DEMO_PRODUCTS, demoImage, uah } from "~/components/home/home.fixtures";
import type { ProductCardData } from "~/components/product/product-card";
import { COMPARE_CATEGORIES, type CompareCategory } from "~/lib/compare/spec-schema";
import type { SavedProduct } from "~/lib/saved-lists";

/** Демо-товари для історій Storybook і тестів обраного та порівняння. */

export const IPHONE_CATEGORY = COMPARE_CATEGORIES.find(
  (category) => category.key === "iphone",
) as CompareCategory;

function saved(index: number, extra: Partial<SavedProduct>): SavedProduct {
  return {
    ...(DEMO_PRODUCTS[index] as ProductCardData),
    vendor: "Apple",
    productType: null,
    options: [],
    shortSpecs: [],
    specs: {},
    ...extra,
  };
}

const IPHONE = { productType: IPHONE_CATEGORY.productType, compareCategory: "iphone" } as const;

export const DEMO_SAVED_PRODUCTS: SavedProduct[] = [
  saved(0, {
    ...IPHONE,
    options: [
      { name: "Пам'ять", values: ["256 ГБ", "512 ГБ", "1 ТБ"] },
      { name: "Колір", values: ["Синій титан", "Срібний"] },
    ],
    shortSpecs: ["Дисплей 6,3 дюйма, 120 Гц", "Чип A19 Pro", "Камера 48 Мп"],
    specs: {
      display_size: "6,3″",
      display_type: "OLED, 120 Гц",
      chip: "A19 Pro",
      storage: "256 ГБ, 512 ГБ, 1 ТБ",
      camera_main: "48 Мп",
      camera_tele: "48 Мп, 4×",
      water: "IP68",
      weight: "206 г",
    },
  }),
  {
    ...IPHONE,
    handle: "iphone-17-256-black",
    variantId: "gid://shopify/ProductVariant/iphone-17-256-black",
    title: "iPhone 17 256 ГБ, чорний",
    image: demoImage(2),
    price: uah(44999),
    availableForSale: true,
    delivery: "доставимо завтра",
    vendor: "Apple",
    options: [
      { name: "Пам'ять", values: ["256 ГБ", "512 ГБ"] },
      { name: "Колір", values: ["Чорний", "Білий", "Лавандовий"] },
    ],
    shortSpecs: ["Дисплей 6,3 дюйма, 120 Гц", "Чип A19", "Камера 48 Мп"],
    specs: {
      display_size: "6,3″",
      display_type: "OLED, 120 Гц",
      chip: "A19",
      storage: "256 ГБ, 512 ГБ",
      camera_main: "48 Мп",
      camera_tele: "Немає",
      water: "IP68",
      weight: "177 г",
    },
  },
  {
    ...IPHONE,
    handle: "iphone-15-pro-128-natural-used",
    variantId: "gid://shopify/ProductVariant/iphone-15-pro-128-natural-used",
    title: "iPhone 15 Pro 128 ГБ, натуральний титан",
    image: demoImage(3),
    price: uah(31999),
    availableForSale: true,
    delivery: "доставимо завтра",
    used: { grade: "Відмінний", batteryHealth: 91 },
    vendor: "Apple",
    options: [{ name: "Пам'ять", values: ["128 ГБ"] }],
    shortSpecs: ["Дисплей 6,1 дюйма, 120 Гц", "Чип A17 Pro", "Камера 48 Мп"],
    specs: {
      display_size: "6,1″",
      display_type: "OLED, 120 Гц",
      chip: "A17 Pro",
      storage: "128 ГБ",
      camera_main: "48 Мп",
      camera_tele: "12 Мп, 3×",
      water: "IP68",
      weight: "187 г",
    },
  },
  {
    ...IPHONE,
    handle: "iphone-16e-128-white",
    title: "iPhone 16e 128 ГБ, білий",
    image: demoImage(4),
    price: uah(27999),
    availableForSale: false,
    vendor: "Apple",
    options: [{ name: "Пам'ять", values: ["128 ГБ", "256 ГБ"] }],
    shortSpecs: ["Дисплей 6,1 дюйма, 60 Гц", "Чип A18", "Камера 48 Мп"],
    specs: {
      display_size: "6,1″",
      display_type: "OLED, 60 Гц",
      chip: "A18",
      storage: "128 ГБ, 256 ГБ",
      camera_main: "48 Мп",
      camera_tele: "Немає",
      water: "IP68",
      weight: "167 г",
    },
  },
];
