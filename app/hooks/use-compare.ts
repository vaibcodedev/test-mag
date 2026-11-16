import { toast } from "~/components/ui/sonner";
import { appNavigate } from "~/lib/app-navigate";
import { plural } from "~/lib/format";
import { COMPARE_LIMIT, compareStore, type SavedListToggleResult } from "~/lib/saved-lists";

import { useSavedListHandles, useSavedListHas } from "./use-saved-list";

export const COMPARE_FULL_MESSAGE = `У порівнянні вже ${COMPARE_LIMIT} ${plural(COMPARE_LIMIT, {
  one: "товар",
  few: "товари",
  many: "товарів",
})}. Приберіть один, щоб додати новий.`;

/** Кнопка в тості «Додано до порівняння»: на мобільному це найкоротший шлях до сторінки. */
export const OPEN_COMPARE_ACTION = {
  label: "Відкрити порівняння",
  onClick: () => appNavigate("/compare"),
};

/** Додає товар до порівняння або прибирає його й показує сповіщення. */
export function toggleCompare(handle: string): SavedListToggleResult {
  const result = compareStore.toggle(handle);

  if (result === "added") toast.success("Додано до порівняння", { action: OPEN_COMPARE_ACTION });
  else if (result === "removed") toast("Прибрано з порівняння");
  else if (result === "full") toast.warning(COMPARE_FULL_MESSAGE);

  return result;
}

/** Порівняння в браузері: до чотирьох handle (на сервері список порожній) і дії над ним. */
export function useCompare() {
  const handles = useSavedListHandles(compareStore);

  return {
    handles,
    count: handles.length,
    limit: COMPARE_LIMIT,
    isFull: handles.length >= COMPARE_LIMIT,
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
