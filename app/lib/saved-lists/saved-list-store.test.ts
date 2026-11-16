import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSavedListStore, isValidHandle, parseSavedList } from "./saved-list-store";

const KEY = "test:list:v1";

function createStore(limit = 4) {
  return createSavedListStore({ key: KEY, limit });
}

/** Подія, яку браузер надсилає іншим вкладкам після зміни localStorage. */
function emitStorage(key: string | null, newValue: string | null) {
  if (key !== null) {
    if (newValue === null) localStorage.removeItem(key);
    else localStorage.setItem(key, newValue);
  }
  window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("isValidHandle", () => {
  it("приймає латинку, кирилицю, цифри, дефіс і підкреслення", () => {
    expect(isValidHandle("iphone-17-pro_256")).toBe(true);
    expect(isValidHandle("чохол-для-iphone")).toBe(true);
  });

  it("відкидає пробіли, розділові знаки, порожній і задовгий рядок та не рядки", () => {
    expect(isValidHandle("")).toBe(false);
    expect(isValidHandle("a b")).toBe(false);
    expect(isValidHandle("a,b")).toBe(false);
    expect(isValidHandle('a"}{')).toBe(false);
    expect(isValidHandle("-leading")).toBe(false);
    expect(isValidHandle("a".repeat(256))).toBe(false);
    expect(isValidHandle(42)).toBe(false);
  });
});

describe("parseSavedList", () => {
  it("лишає тільки коректні handle без повторів і в межах ліміту", () => {
    expect(parseSavedList('["a","b","a",5,"bad handle","c","d","e"]', 4)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("для зламаних даних повертає порожній список", () => {
    expect(parseSavedList("{oops", 4)).toEqual([]);
    expect(parseSavedList('{"a":1}', 4)).toEqual([]);
    expect(parseSavedList("null", 4)).toEqual([]);
    expect(parseSavedList(null, 4)).toEqual([]);
  });
});

describe("createSavedListStore", () => {
  it("додає, прибирає й перемикає товари та зберігає список у localStorage", () => {
    const store = createStore();

    expect(store.add("a")).toBe("added");
    expect(store.add("a")).toBe("exists");
    expect(store.toggle("b")).toBe("added");
    expect(store.getSnapshot()).toEqual(["a", "b"]);
    expect(store.has("b")).toBe(true);
    expect(localStorage.getItem(KEY)).toBe('["a","b"]');

    expect(store.toggle("a")).toBe("removed");
    store.remove("b");
    expect(store.getSnapshot()).toEqual([]);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("не додає понад ліміт і повідомляє про це", () => {
    const store = createStore(2);
    store.add("a");
    store.add("b");

    expect(store.add("c")).toBe("full");
    expect(store.toggle("c")).toBe("full");
    expect(store.getSnapshot()).toEqual(["a", "b"]);
    // Прибрати товар із повного списку можна.
    expect(store.toggle("a")).toBe("removed");
  });

  it("не приймає рядок, який не схожий на handle", () => {
    const store = createStore();

    expect(store.add("bad handle")).toBe("invalid");
    expect(store.toggle("")).toBe("invalid");
    expect(store.getSnapshot()).toEqual([]);
  });

  it("очищає список", () => {
    const store = createStore();
    store.add("a");
    store.clear();

    expect(store.getSnapshot()).toEqual([]);
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("читає збережений список і віддає той самий масив, доки нічого не змінилось", () => {
    localStorage.setItem(KEY, '["a","b"]');
    const store = createStore();

    expect(store.getSnapshot()).toEqual(["a", "b"]);
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it("серверний знімок завжди порожній і стабільний", () => {
    localStorage.setItem(KEY, '["a"]');
    const store = createStore();

    expect(store.getServerSnapshot()).toEqual([]);
    expect(store.getServerSnapshot()).toBe(store.getServerSnapshot());
  });

  it("зламані дані у сховищі не ламають стор", () => {
    localStorage.setItem(KEY, "{not json");
    const store = createStore();

    expect(store.getSnapshot()).toEqual([]);
    expect(store.add("a")).toBe("added");
    expect(localStorage.getItem(KEY)).toBe('["a"]');
  });

  it("працює в пам'яті, коли localStorage кидає помилки", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    const store = createStore();
    const listener = vi.fn();
    store.subscribe(listener);

    expect(store.getSnapshot()).toEqual([]);
    expect(store.add("a")).toBe("added");
    expect(store.getSnapshot()).toEqual(["a"]);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("працює в пам'яті, коли сховища немає зовсім", () => {
    const store = createSavedListStore({ key: KEY, limit: 4, storage: () => null });

    expect(store.toggle("a")).toBe("added");
    expect(store.getSnapshot()).toEqual(["a"]);
  });

  it("сповіщає підписників про зміни й перестає після відписки", () => {
    const store = createStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.add("a");
    store.add("a");
    expect(listener).toHaveBeenCalledOnce();

    unsubscribe();
    store.add("b");
    expect(listener).toHaveBeenCalledOnce();
  });

  it("підхоплює зміни з іншої вкладки через подію storage", () => {
    const store = createStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.add("a");
    listener.mockClear();

    emitStorage(KEY, '["a","b"]');
    expect(store.getSnapshot()).toEqual(["a", "b"]);
    expect(listener).toHaveBeenCalledOnce();

    // Чужий ключ і подія без змін не чіпають підписників.
    emitStorage("other", "1");
    emitStorage(KEY, '["a","b"]');
    expect(listener).toHaveBeenCalledOnce();

    // key === null — інша вкладка очистила все сховище.
    localStorage.clear();
    emitStorage(null, null);
    expect(store.getSnapshot()).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("без підписників не слухає подію storage", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const store = createStore();

    const first = store.subscribe(() => {});
    const second = store.subscribe(() => {});
    expect(add.mock.calls.filter(([type]) => String(type) === "storage")).toHaveLength(1);

    first();
    second();
    expect(remove.mock.calls.filter(([type]) => String(type) === "storage")).toHaveLength(1);
  });
});
