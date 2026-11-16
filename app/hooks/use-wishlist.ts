import { toast } from "~/components/ui/sonner";
import { plural } from "~/lib/format";
import { WISHLIST_LIMIT, wishlistStore, type SavedListToggleResult } from "~/lib/saved-lists";

import { useSavedListHandles, useSavedListHas } from "./use-saved-list";

export const WISHLIST_FULL_MESSAGE = `В обраному вже ${WISHLIST_LIMIT} ${plural(WISHLIST_LIMIT, {
  one: "товар",
  few: "товари",
  many: "товарів",
})}. Приберіть один, щоб додати новий.`;

/** Додає товар в обране або прибирає його й показує сповіщення. */
export function toggleWishlist(handle: string): SavedListToggleResult {
  const result = wishlistStore.toggle(handle);

  if (result === "added") toast.success("Додано в обране");
  else if (result === "removed") toast("Прибрано з обраного");
  else if (result === "full") toast.warning(WISHLIST_FULL_MESSAGE);

  return result;
}

/** Обране в браузері: список handle (на сервері порожній) і дії над ним. */
export function useWishlist() {
  const handles = useSavedListHandles(wishlistStore);

  return {
    handles,
    count: handles.length,
    /** З сповіщенням. */
    toggle: toggleWishlist,
    /** Без сповіщення. */
    remove: wishlistStore.remove,
    clear: wishlistStore.clear,
  };
}

/** Стан кнопки-сердечка для одного товару. */
export function useIsWishlisted(handle: string): boolean {
  return useSavedListHas(wishlistStore, handle);
}
