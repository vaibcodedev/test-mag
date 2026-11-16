import type { PredictiveSearchStatus } from "@shopify/hydrogen";

type SuggestionSummary = {
  status: PredictiveSearchStatus;
  result: {
    term: string;
    items: {
      products: readonly unknown[];
      collections?: readonly unknown[];
      queries?: readonly unknown[];
    };
  };
};

/**
 * Типи підказок: запити («Часто шукають»), товари й колекції («Категорії»).
 * Одне джерело для сервера (типові значення /api/predictive-search) і клієнта (параметр `types`).
 */
export const PREDICTIVE_SEARCH_TYPES = ["QUERY", "PRODUCT", "COLLECTION"] as const;

// Файл запускає і node:test (__test__/), тому він не імпортує нічого через аліас ~/.
const pluralRules = new Intl.PluralRules("uk-UA");

function suggestionsWord(count: number): string {
  const category = pluralRules.select(count);
  if (category === "one") return "підказка";
  if (category === "few") return "підказки";
  return "підказок";
}

/**
 * Текст для live-регіону зі списком підказок. Озвучуємо лише готовий результат: стор переходить
 * у `loading` на кожне натискання клавіші, і оголошувати це означало б перебивати набір.
 */
export function describeSuggestions({ status, result }: SuggestionSummary): string {
  if (status !== "success") return "";
  const { products, collections = [], queries = [] } = result.items;
  const count = products.length + collections.length + queries.length;
  if (count === 0) return `Нічого не знайшли за запитом «${result.term}»`;
  return `${count} ${suggestionsWord(count)} за запитом «${result.term}»`;
}
