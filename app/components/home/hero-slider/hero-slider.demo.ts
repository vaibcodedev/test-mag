import { demoImage, uah } from "~/components/home/home.fixtures";

import type { HomeBanner } from "./hero-slider.types";

// TODO(реальний магазин): записи метаоб'єкта `home_banner` (лейбл, заголовок, слово-акцент,
// підзаголовок, чипи, кольори, ціна, кількість платежів, фото, посилання, порядок).
// Значення hex — дані товару з метаполя custom.color_swatches, а не кольори інтерфейсу.
export const DEMO_HOME_BANNERS: HomeBanner[] = [
  {
    id: "iphone-17-pro",
    label: "Новинка осені",
    title: "iPhone 17 Pro",
    accent: "Pro",
    subtitle: "Три камери по 48 Мп і найбільший акумулятор серед iPhone Pro. Уже в шоурумі.",
    specs: ["A19 Pro", "Екран 6,3″ 120 Гц", "Від 256 ГБ"],
    colors: [
      { name: "Космічний помаранчевий", hex: "#f77e2d" },
      { name: "Темно-синій", hex: "#32374a" },
      { name: "Сріблястий", hex: "#e3e4e5" },
    ],
    price: uah(64999),
    installmentMonths: 25,
    image: demoImage(0),
    href: "/products/iphone-17-pro-256-blue",
    compareHref: "/collections/iphone",
    delivery: "Доставимо завтра",
  },
  {
    id: "macbook-air-m4",
    label: "Для навчання й роботи",
    title: "MacBook Air M4",
    accent: "Air",
    subtitle: "Легкий ноутбук на цілий день без зарядки. Допоможемо перенести дані зі старого.",
    specs: ["Чип M4", "16 ГБ пам'яті", "До 18 годин роботи"],
    colors: [
      { name: "Небесно-блакитний", hex: "#c9d6e4" },
      { name: "Темна ніч", hex: "#2e3642" },
      { name: "Сяйво зірок", hex: "#f0e5d3" },
      { name: "Сріблястий", hex: "#e3e4e5" },
    ],
    price: uah(49999),
    installmentMonths: 25,
    image: demoImage(1),
    href: "/products/macbook-air-13-m4-256-midnight",
    compareHref: "/collections/mac",
    delivery: "Доставимо завтра",
  },
  {
    id: "ipad-air",
    label: "Для нотаток і малювання",
    title: "iPad Air",
    accent: "Air",
    subtitle:
      "Планшет із чипом M3 для конспектів, малювання та фільмів. Працює з Apple Pencil Pro.",
    specs: ["Чип M3", "11″ або 13″", "Apple Pencil Pro"],
    colors: [
      { name: "Синій", hex: "#c5d5e4" },
      { name: "Фіолетовий", hex: "#dcd3e6" },
      { name: "Сяйво зірок", hex: "#f0e5d3" },
      { name: "Космічний сірий", hex: "#6e6e73" },
    ],
    price: uah(28999),
    installmentMonths: 25,
    image: demoImage(4),
    href: "/products/ipad-air-11-m3-128-blue",
    compareHref: "/collections/ipad",
    delivery: "Доставимо завтра",
  },
  {
    id: "airpods-pro-3",
    label: "Хіт продажів",
    title: "AirPods Pro 3",
    accent: "Pro 3",
    subtitle: "Сильніше шумозаглушення, датчик пульсу й до 8 годин музики на одному заряді.",
    specs: ["Шумозаглушення", "Датчик пульсу", "Захист IP57"],
    price: uah(11999),
    priceFrom: false,
    installmentMonths: 10,
    image: demoImage(3),
    href: "/products/airpods-pro-3",
    compareHref: "/collections/airpods",
    delivery: "Доставимо завтра",
  },
];
