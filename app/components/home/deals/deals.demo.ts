import type { DealsContent } from "./deals";

/**
 * TODO(реальний магазин): тексти й дату завершення читати з метаоб'єкта `home_deals`
 * (заголовок, опис, підпис відліку, дата й час завершення); товари — з колекції `deals`.
 */
export const DEALS_DEMO_CONTENT: DealsContent = {
  title: "Знижки тижня",
  description: "Ціни знижено до неділі. Товар зі знижкою має ту саму гарантію, що й без неї.",
  countdownLabel: "До кінця акції",
  finishedText: "Акцію завершено",
  link: { title: "Усі товари зі знижкою", to: "/collections/deals" },
};

/** Неділя, кінець дня за київським часом. */
export const DEALS_DEMO_ENDS_AT = "2026-11-22T23:59:59+02:00";
