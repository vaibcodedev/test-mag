import { STORE_INFO, type StoreInfo } from "~/lib/content/site";

import type { ShowroomDeliveryRow } from "./showroom";

/*
  TODO(реальний магазин): адресу, координати, години, телефон і Telegram читати
  з метаоб'єкта `store_info`. Рядки доставки поки не мають свого типу: додати
  метаоб'єкт `delivery_option` (іконка lucide, заголовок, підпис) за зразком `usp`.
*/

export const SHOWROOM_DEMO_STORE: StoreInfo = STORE_INFO;

export const SHOWROOM_DEMO_DESCRIPTION =
  "Приходьте потримати техніку в руках, порівняти моделі й забрати замовлення. Каву зваримо.";

export const SHOWROOM_DEMO_DELIVERY: ShowroomDeliveryRow[] = [
  {
    icon: "truck",
    title: "Нова пошта по Україні",
    text: "Відправляємо в день замовлення, зазвичай посилка приїжджає завтра.",
  },
  {
    icon: "bike",
    title: "Кур'єр по Вінниці",
    text: "Привеземо сьогодні, якщо замовити до 18:00.",
  },
  {
    icon: "send",
    title: "Замовлення в Telegram",
    text: "Напишіть, що потрібно, і оберіть самовивіз із шоуруму або доставку.",
  },
];
