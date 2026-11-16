import type { Review, ReviewsRating } from "./reviews";

/*
  TODO(реальний магазин): відгуки читати з метаоб'єктів `review` (ім'я, текст, дата, джерело).
  Оцінку, кількість відгуків і посилання на картку в Google додати полями до `store_info`.
*/

export const REVIEWS_DEMO_RATING: ReviewsRating = {
  value: 4.9,
  count: 412,
  url: "https://www.google.com/maps/search/?api=1&query=49.2331,28.4682",
};

export const REVIEWS_DEMO: Review[] = [
  {
    name: "Ірина Коваль",
    text: "Замовила iPhone увечері, наступного дня забрала на Новій пошті в Одесі. Перед відправкою надіслали відео з перевіркою IMEI та станом коробки. Через місяць написала з питанням про акумулятор, і мене згадали на ім'я.",
    date: "2026-10-28",
    source: "Google",
  },
  {
    name: "Максим Гнатюк",
    text: "Здав старий MacBook у trade-in і доплатив різницю частинами через monobank. Оцінили за двадцять хвилин, дані перенесли на місці. Ціну, яку назвали в Telegram, у шоурумі не змінювали.",
    date: "2026-09-14",
    source: "Google",
  },
];
