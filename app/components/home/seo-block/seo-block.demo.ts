import { BUYER_LINKS } from "~/lib/content/site";

import type { SeoBlockLink } from "./seo-block";

/*
  TODO(реальний магазин): заголовок і абзаци читати з метаоб'єкта `seo_text`
  (або з вмісту сторінки Shopify), списки посилань — з меню Shopify
  `seo-popular-models`, `footer-buyers` і `seo-popular-queries`.
*/

export const SEO_BLOCK_DEMO_TITLE = "Техніка Apple у Вінниці з доставкою по Україні";

export const SEO_BLOCK_DEMO_MODELS: SeoBlockLink[] = [
  { title: "iPhone 17 Pro", to: "/collections/iphone" },
  { title: "iPhone 17", to: "/collections/iphone" },
  { title: "iPhone Air", to: "/collections/iphone" },
  { title: "MacBook Air 13 M4", to: "/collections/mac" },
  { title: "MacBook Pro 14 M5", to: "/collections/mac" },
  { title: "iPad Air 11 M3", to: "/collections/ipad" },
  { title: "Apple Watch Series 11", to: "/collections/watch" },
  { title: "AirPods Pro 3", to: "/collections/airpods" },
];

export const SEO_BLOCK_DEMO_BUYER_LINKS: SeoBlockLink[] = BUYER_LINKS;

export const SEO_BLOCK_DEMO_QUERIES: SeoBlockLink[] = [
  { title: "купити iPhone у Вінниці", to: "/collections/iphone" },
  { title: "iPhone частинами monobank", to: "/pages/installments" },
  { title: "вживаний iPhone з гарантією", to: "/collections/used" },
  { title: "MacBook для навчання", to: "/collections/students" },
  { title: "обміняти старий iPhone на новий", to: "/pages/trade-in" },
  { title: "перевірити iPhone за IMEI", to: "/pages/imei" },
  { title: "знижки на техніку Apple", to: "/collections/deals" },
];

export const SEO_BLOCK_DEMO_PARAGRAPHS: string[] = [
  "«Сад» — невеликий магазин техніки Apple у центрі Вінниці. У шоурумі на вул. Соборній, 64 можна потримати в руках iPhone, MacBook, iPad, Apple Watch і AirPods, порівняти моделі й забрати замовлення того ж дня. Якщо ви з іншого міста, відправимо покупку Новою поштою: більшість замовлень приїжджає наступного дня.",
  "Уся нова техніка має гарантію 12 місяців, вживані пристрої — 6 місяців. Перед продажем ми перевіряємо кожен пристрій за IMEI та серійним номером і показуємо результат покупцеві. На вживаних iPhone вказуємо оцінку стану та ємність акумулятора, тож ви знаєте, що купуєте, ще до того, як відкриєте коробку.",
  "Оплатити покупку можна карткою, Apple Pay або частинами: до 25 платежів без переплати через monobank і ПриватБанк. Старий пристрій приймаємо в trade-in і зараховуємо його вартість у ціну нового. Протягом 14 днів товар можна обміняти або повернути.",
  "Не знаєте, який iPhone обрати у 2026 році чи який MacBook підійде для навчання? Напишіть нам у Telegram або зателефонуйте: відповідаємо за кілька хвилин, щодня з 10:00 до 20:00. Допоможемо підібрати модель під ваші задачі, перенесемо дані зі старого пристрою та наклеїмо захисне скло.",
];
