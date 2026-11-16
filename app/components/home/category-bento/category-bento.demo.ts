import { demoImage, uah } from "~/components/home/home.fixtures";

import type { BentoCategory } from "./category-bento-tile";

// TODO(реальний магазин): це не метаоб'єкт, а колекції магазину зі Storefront API:
// назва, handle, фото колекції, кількість товарів і найнижча ціна (перший товар
// за сортуванням PRICE). Перша в списку — iPhone: вона стає великою ink-плиткою.
export const DEMO_BENTO_CATEGORIES: BentoCategory[] = [
  {
    title: "iPhone",
    to: "/collections/iphone",
    image: demoImage(0),
    productCount: 64,
    priceFrom: uah(24999),
  },
  {
    title: "Mac",
    to: "/collections/mac",
    image: demoImage(1),
    productCount: 38,
    priceFrom: uah(39999),
  },
  {
    title: "iPad",
    to: "/collections/ipad",
    image: demoImage(4),
    productCount: 27,
    priceFrom: uah(16999),
  },
  {
    title: "Watch",
    to: "/collections/watch",
    image: demoImage(2),
    productCount: 22,
    priceFrom: uah(11999),
  },
  {
    title: "AirPods",
    to: "/collections/airpods",
    image: demoImage(3),
    productCount: 9,
    priceFrom: uah(5999),
  },
  {
    title: "Аксесуари",
    to: "/collections/accessories",
    image: demoImage(1),
    productCount: 71,
    priceFrom: uah(499),
  },
  {
    title: "Вживані",
    to: "/collections/used",
    image: demoImage(0),
    productCount: 17,
    priceFrom: uah(9999),
  },
];

/** Сума productCount у демо-категоріях. */
export const DEMO_BENTO_TOTAL_PRODUCTS = 248;
