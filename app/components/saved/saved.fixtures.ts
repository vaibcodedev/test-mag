import { DEMO_PRODUCTS, demoImage, uah } from "~/components/home/home.fixtures";
import type { ProductCardData } from "~/components/product/product-card";
import type { SavedProduct } from "~/lib/saved-lists";

/** Демо-товари для історій Storybook і тестів обраного та порівняння. */

function saved(index: number, extra: Partial<SavedProduct>): SavedProduct {
  return {
    ...(DEMO_PRODUCTS[index] as ProductCardData),
    vendor: "Apple",
    productType: null,
    options: [],
    shortSpecs: [],
    ...extra,
  };
}

export const DEMO_SAVED_PRODUCTS: SavedProduct[] = [
  saved(0, {
    productType: "Смартфон",
    options: [
      { name: "Пам'ять", values: ["256 ГБ", "512 ГБ", "1 ТБ"] },
      { name: "Колір", values: ["Синій титан", "Срібний"] },
    ],
    shortSpecs: ["Дисплей 6,3 дюйма, 120 Гц", "Чип A19 Pro", "Камера 48 Мп"],
  }),
  {
    handle: "iphone-17-256-black",
    title: "iPhone 17 256 ГБ, чорний",
    image: demoImage(2),
    price: uah(44999),
    availableForSale: true,
    delivery: "доставимо завтра",
    vendor: "Apple",
    productType: "Смартфон",
    options: [
      { name: "Пам'ять", values: ["256 ГБ", "512 ГБ"] },
      { name: "Колір", values: ["Чорний", "Білий", "Лавандовий"] },
    ],
    shortSpecs: ["Дисплей 6,3 дюйма, 120 Гц", "Чип A19", "Камера 48 Мп"],
  },
  {
    handle: "iphone-15-pro-128-natural-used",
    title: "iPhone 15 Pro 128 ГБ, натуральний титан",
    image: demoImage(3),
    price: uah(31999),
    availableForSale: true,
    delivery: "доставимо завтра",
    used: { grade: "Відмінний", batteryHealth: 91 },
    vendor: "Apple",
    productType: "Смартфон",
    options: [{ name: "Пам'ять", values: ["128 ГБ"] }],
    shortSpecs: ["Дисплей 6,1 дюйма, 120 Гц", "Чип A17 Pro", "Камера 48 Мп"],
  },
  {
    handle: "iphone-16e-128-white",
    title: "iPhone 16e 128 ГБ, білий",
    image: demoImage(4),
    price: uah(27999),
    availableForSale: false,
    vendor: "Apple",
    productType: "Смартфон",
    options: [{ name: "Пам'ять", values: ["128 ГБ", "256 ГБ"] }],
    shortSpecs: ["Дисплей 6,1 дюйма, 60 Гц", "Чип A18", "Камера 48 Мп"],
  },
];
