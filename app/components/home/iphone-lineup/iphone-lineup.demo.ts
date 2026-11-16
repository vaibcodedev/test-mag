import { demoImage, uah } from "~/components/home/home.fixtures";

import type { IphoneLineupModel } from "./iphone-lineup";

// TODO(реальний магазин): окремого метаоб'єкта в специфікації немає. Моделі — товари
// колекції iphone (назва, фото, найнижча ціна зі Storefront API), три відмінності —
// перші три значення метаполя товару custom.short_specs.
export const DEMO_IPHONE_LINEUP: IphoneLineupModel[] = [
  {
    title: "iPhone 17 Pro Max",
    to: "/products/iphone-17-pro-max",
    image: demoImage(0),
    price: uah(72999),
    highlights: ["Екран 6,9″, 120 Гц", "Три камери по 48 Мп", "Найдовше тримає заряд"],
  },
  {
    title: "iPhone 17 Pro",
    to: "/products/iphone-17-pro",
    image: demoImage(4),
    price: uah(64999),
    highlights: ["Екран 6,3″, 120 Гц", "Три камери по 48 Мп", "Чип A19 Pro"],
  },
  {
    title: "iPhone Air",
    to: "/products/iphone-air",
    image: demoImage(2),
    price: uah(54999),
    highlights: ["Товщина 5,6 мм", "Екран 6,5″, 120 Гц", "Одна камера 48 Мп"],
  },
  {
    title: "iPhone 17",
    to: "/products/iphone-17",
    image: demoImage(1),
    price: uah(44999),
    highlights: ["Екран 6,3″, 120 Гц", "Дві камери по 48 Мп", "256 ГБ уже в базі"],
  },
  {
    title: "iPhone 16",
    to: "/products/iphone-16",
    image: demoImage(3),
    price: uah(36999),
    highlights: ["Екран 6,1″, 60 Гц", "Кнопка керування камерою", "Чип A18"],
  },
  {
    title: "iPhone 16e",
    to: "/products/iphone-16e",
    image: demoImage(0),
    price: uah(29999),
    highlights: ["Найдоступніший iPhone", "Одна камера 48 Мп", "Чип A18"],
  },
];
