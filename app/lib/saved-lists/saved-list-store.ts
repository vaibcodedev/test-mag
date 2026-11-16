/**
 * Список handle товарів, який живе в браузері: обране або порівняння.
 *
 * Без React: стор віддає знімок і підписку, а хуки в app/hooks підключають його
 * через useSyncExternalStore. Знімок — той самий масив, доки список не змінився.
 * Якщо localStorage недоступний (приватний режим, заборона cookie, переповнення),
 * список працює в пам'яті до кінця відвідування.
 */

/** Латинка, кирилиця й цифри з дефісами та підкресленнями — так Shopify будує handle. */
const HANDLE_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u;
export const HANDLE_MAX_LENGTH = 255;

export function isValidHandle(value: unknown): value is string {
  return (
    typeof value === "string" && value.length <= HANDLE_MAX_LENGTH && HANDLE_PATTERN.test(value)
  );
}

/** invalid — рядок не схожий на handle товару, тож у список не потрапляє. */
export type SavedListToggleResult = "added" | "removed" | "full" | "invalid";
export type SavedListAddResult = "added" | "exists" | "full" | "invalid";

export type SavedListStore = {
  /** Ключ у localStorage; версія в ключі дозволяє змінити формат без міграції. */
  readonly key: string;
  readonly limit: number;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => readonly string[];
  /** На сервері список завжди порожній: так розмітка збігається під час гідратації. */
  getServerSnapshot: () => readonly string[];
  has: (handle: string) => boolean;
  add: (handle: string) => SavedListAddResult;
  remove: (handle: string) => void;
  toggle: (handle: string) => SavedListToggleResult;
  clear: () => void;
};

export type SavedListStoreOptions = {
  key: string;
  /** Скільки товарів уміщує список. */
  limit: number;
  /** Сховище для тестів; у браузері береться window.localStorage. */
  storage?: () => Storage | null;
};

const EMPTY: readonly string[] = Object.freeze([]);

function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    // Доступ до localStorage кидає SecurityError, коли сховище заблоковане.
    return null;
  }
}

/** Розбирає значення зі сховища: зайве, зламане та дублікати відкидаються. */
export function parseSavedList(raw: string | null, limit: number): readonly string[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const handles = [...new Set(parsed.filter(isValidHandle))].slice(0, limit);
    return handles.length > 0 ? handles : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function createSavedListStore({
  key,
  limit,
  storage = browserStorage,
}: SavedListStoreOptions): SavedListStore {
  const listeners = new Set<() => void>();
  let handles: readonly string[] = EMPTY;
  let loaded = false;

  function read(): readonly string[] {
    try {
      return parseSavedList(storage()?.getItem(key) ?? null, limit);
    } catch {
      return EMPTY;
    }
  }

  function ensureLoaded() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    handles = read();
  }

  function emit() {
    for (const listener of listeners) listener();
  }

  function commit(next: readonly string[]) {
    handles = next.length > 0 ? next : EMPTY;
    try {
      const target = storage();
      if (handles.length > 0) target?.setItem(key, JSON.stringify(handles));
      else target?.removeItem(key);
    } catch {
      // Сховище заблоковане або переповнене: список лишається в пам'яті.
    }
    emit();
  }

  /** Інша вкладка змінила список (або очистила все сховище: тоді key дорівнює null). */
  function onStorage(event: StorageEvent) {
    if (event.key !== null && event.key !== key) return;
    const next = read();
    if (next.length === handles.length && next.every((handle, index) => handle === handles[index]))
      return;
    loaded = true;
    handles = next;
    emit();
  }

  function subscribe(listener: () => void) {
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
    }
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
      }
    };
  }

  function getSnapshot() {
    ensureLoaded();
    return handles;
  }

  function has(handle: string) {
    return getSnapshot().includes(handle);
  }

  function add(handle: string): SavedListAddResult {
    const current = getSnapshot();
    if (current.includes(handle)) return "exists";
    if (!isValidHandle(handle)) return "invalid";
    if (current.length >= limit) return "full";
    commit([...current, handle]);
    return "added";
  }

  function remove(handle: string) {
    const current = getSnapshot();
    if (current.includes(handle)) commit(current.filter((item) => item !== handle));
  }

  function toggle(handle: string): SavedListToggleResult {
    if (has(handle)) {
      remove(handle);
      return "removed";
    }
    const result = add(handle);
    return result === "exists" ? "added" : result;
  }

  function clear() {
    if (getSnapshot().length > 0) commit(EMPTY);
  }

  return {
    key,
    limit,
    subscribe,
    getSnapshot,
    getServerSnapshot: () => EMPTY,
    has,
    add,
    remove,
    toggle,
    clear,
  };
}
