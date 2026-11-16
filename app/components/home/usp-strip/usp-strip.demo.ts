import type { Usp } from "./usp-strip";

// TODO(реальний магазин): записи метаоб'єкта `usp` (іконка lucide, заголовок, підпис).
export const DEMO_USPS: Usp[] = [
  {
    icon: "truck",
    title: "Доставка завтра",
    caption: "Новою поштою по Україні, у Вінниці кур'єром",
  },
  {
    icon: "shield-check",
    title: "Гарантія 12 місяців",
    caption: "Ремонт або заміна без біганини",
  },
  {
    icon: "credit-card",
    title: "0% частинами",
    caption: "До 25 платежів від monobank і ПриватБанку",
  },
  {
    icon: "rotate-ccw",
    title: "14 днів на повернення",
    caption: "Якщо пристрій не підійшов",
  },
  {
    icon: "message-circle",
    title: "Відповідаємо за 5 хвилин",
    caption: "У Telegram і телефоном, щодня 10:00–20:00",
  },
];
