import type { ProductCardData, ProductCardImage } from "~/components/product/product-card";
import type { Money } from "~/lib/format";

/**
 * Спільні демо-дані для історій Storybook і тестів секцій головної.
 * На сайті секції отримують справжні товари й фото з loader маршруту.
 */

const CDN =
  "https://cdn.shopify.com/mock-shop-production-media/_image_studio/ea62fe2c-4ccf-4787-9cf0-dbfa4a4f2747";

function image(file: string): ProductCardImage {
  return { url: `${CDN}/${file}.png`, altText: "", width: 928, height: 1152 };
}

/** Демо-фото з mock.shop. */
export const DEMO_IMAGES: ProductCardImage[] = [
  image("2c9dfe14599dfdf016b15700528a30f9822ad13cb9e2095ad6000685fa06a18a"),
  image("c49583e8723152603f72ad28dcca1d4ec9f5d89305abeec15cb609593f3e6d1e"),
  image("67830b8beefa80ecc47c1664cad1f86de52c5c5461ba5e0a5754cdcf726ad900"),
  image("358d3ff45f4d76d9dd474f5cae4e019d3a2394c05c470f733ceacb79c58c6d7d"),
  image("8e912450fd4796b0778479a3d6ab60f1b5f48124fad6dc97e3870c02360e4e7c"),
];

/** Фото за індексом по колу: демо-фото менше, ніж місць під них. */
export function demoImage(index: number): ProductCardImage {
  return DEMO_IMAGES[index % DEMO_IMAGES.length] as ProductCardImage;
}

export function uah(amount: number): Money {
  return { amount: String(amount), currencyCode: "UAH" };
}

export const DEMO_PRODUCTS: ProductCardData[] = [
  {
    handle: "iphone-17-pro-256-blue",
    compareCategory: "iphone",
    title: "iPhone 17 Pro 256 ГБ, синій титан",
    image: demoImage(0),
    price: uah(64999),
    availableForSale: true,
    badge: "Хіт",
    rating: { value: 4.9, count: 128 },
    delivery: "доставимо завтра",
  },
  {
    handle: "macbook-air-13-m4-256-midnight",
    compareCategory: "mac",
    title: "MacBook Air 13 M4 16/256 ГБ, темна ніч",
    image: demoImage(1),
    price: uah(49999),
    compareAtPrice: uah(54499),
    availableForSale: true,
    rating: { value: 4.8, count: 64 },
    delivery: "доставимо завтра",
  },
  {
    handle: "apple-watch-series-11-46-black",
    compareCategory: "watch",
    title: "Apple Watch Series 11 46 мм, чорний",
    image: demoImage(2),
    price: uah(21999),
    compareAtPrice: uah(23999),
    availableForSale: true,
    badge: "Новинка",
    rating: { value: 5, count: 12 },
    delivery: "доставимо завтра",
  },
  {
    handle: "airpods-pro-3",
    compareCategory: "airpods",
    title: "AirPods Pro 3 з MagSafe",
    image: demoImage(3),
    price: uah(11999),
    compareAtPrice: uah(12999),
    availableForSale: true,
    rating: { value: 4.9, count: 203 },
    delivery: "доставимо завтра",
  },
  {
    handle: "ipad-air-11-m3-128-blue",
    compareCategory: "ipad",
    title: "iPad Air 11 M3 128 ГБ Wi-Fi, синій",
    image: demoImage(4),
    price: uah(28999),
    availableForSale: true,
    rating: { value: 4.7, count: 31 },
    delivery: "доставимо 18 листопада",
  },
  {
    handle: "iphone-air-256-sky",
    compareCategory: "iphone",
    title: "iPhone Air 256 ГБ, небесний",
    image: demoImage(0),
    price: uah(54999),
    availableForSale: true,
    badge: "Топ",
    rating: { value: 4.8, count: 47 },
    delivery: "доставимо завтра",
  },
];

/** Демо вживаних пристроїв для секції used-devices. */
export const DEMO_USED_PRODUCTS: ProductCardData[] = [
  {
    handle: "used-iphone-15-pro-128-natural",
    compareCategory: "iphone",
    title: "iPhone 15 Pro 128 ГБ, натуральний титан",
    image: demoImage(0),
    price: uah(31999),
    availableForSale: true,
    delivery: "доставимо завтра",
    used: { grade: "Відмінний", batteryHealth: 91 },
  },
  {
    handle: "used-iphone-14-128-blue",
    compareCategory: "iphone",
    title: "iPhone 14 128 ГБ, синій",
    image: demoImage(4),
    price: uah(19999),
    availableForSale: true,
    delivery: "доставимо завтра",
    used: { grade: "Як новий", batteryHealth: 97 },
  },
  {
    handle: "used-macbook-air-13-m2-256",
    compareCategory: "mac",
    title: "MacBook Air 13 M2 8/256 ГБ, сріблястий",
    image: demoImage(1),
    price: uah(29999),
    availableForSale: true,
    delivery: "доставимо завтра",
    used: { grade: "Хороший", batteryHealth: 86 },
  },
];
