import { toast } from "~/components/ui/sonner";
import { appNavigate } from "~/lib/app-navigate";
import { COMPARE_CATEGORIES, type CompareCategoryKey } from "~/lib/compare/spec-schema";
import { plural } from "~/lib/format";
import {
  COMPARE_LIMIT,
  compareStore,
  countCompared,
  rememberCompareCategory,
  type SavedListAddResult,
  type SavedListToggleResult,
} from "~/lib/saved-lists";

import { useSavedListHandles, useSavedListHas } from "./use-saved-list";

/** «У порівнянні вже 4 товари категорії iPhone. Приберіть один, щоб додати новий.» */
export function compareFullMessage(category: CompareCategoryKey): string {
  const title = COMPARE_CATEGORIES.find((item) => item.key === category)?.title ?? "";
  const noun = plural(COMPARE_LIMIT, { one: "товар", few: "товари", many: "товарів" });
  return `У порівнянні вже ${COMPARE_LIMIT} ${noun} категорії ${title}. Приберіть один, щоб додати новий.`;
}

/** Кнопка в тості «Додано до порівняння»: на мобільному це найкоротший шлях до сторінки. */
export const OPEN_COMPARE_ACTION = {
  label: "Відкрити порівняння",
  onClick: () => appNavigate("/compare"),
};

/**
 * Додає товар до порівняння без сповіщень. Порівнюються товари однієї категорії,
 * тож ліміт — чотири в кожній: iPhone з iPhone, Mac із Mac.
 */
export function addToCompare(handle: string, category: CompareCategoryKey): SavedListAddResult {
  if (compareStore.has(handle)) return "exists";
  if (countCompared(category) >= COMPARE_LIMIT) return "full";
  const result = compareStore.add(handle);
  if (result === "added") rememberCompareCategory(handle, category);
  return result;
}

/** Додає товар до порівняння або прибирає його й показує сповіщення. */
export function toggleCompare(handle: string, category: CompareCategoryKey): SavedListToggleResult {
  if (compareStore.has(handle)) {
    compareStore.remove(handle);
    toast("Прибрано з порівняння");
    return "removed";
  }

  const result = addToCompare(handle, category);
  if (result === "added") toast.success("Додано до порівняння", { action: OPEN_COMPARE_ACTION });
  else if (result === "full") toast.warning(compareFullMessage(category));

  return result === "exists" ? "added" : result;
}

/** Порівняння в браузері: handle товарів (на сервері список порожній) і дії над ним. */
export function useCompare() {
  const handles = useSavedListHandles(compareStore);

  return {
    handles,
    count: handles.length,
    /** Скільки товарів однієї категорії вміщує таблиця. */
    limit: COMPARE_LIMIT,
    /** З сповіщенням. */
    toggle: toggleCompare,
    /** Без сповіщення. */
    remove: compareStore.remove,
    clear: compareStore.clear,
  };
}

/** Стан кнопки з терезами для одного товару. */
export function useIsCompared(handle: string): boolean {
  return useSavedListHas(compareStore, handle);
}
