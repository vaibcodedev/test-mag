import { useCallback, useSyncExternalStore } from "react";

import type { SavedListStore } from "~/lib/saved-lists";

/**
 * Список зі стору обраного чи порівняння.
 * На сервері й під час гідратації він порожній, після монтування — з localStorage.
 */
export function useSavedListHandles(store: SavedListStore): readonly string[] {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

/** Чи є товар у списку. Компонент перемальовується лише тоді, коли змінюється саме ця відповідь. */
export function useSavedListHas(store: SavedListStore, handle: string): boolean {
  const getSnapshot = useCallback(() => store.has(handle), [store, handle]);
  return useSyncExternalStore(store.subscribe, getSnapshot, getServerSnapshot);
}

function getServerSnapshot() {
  return false;
}
