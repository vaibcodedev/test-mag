import { COMPARE_CATEGORIES, type CompareCategoryKey } from "~/lib/compare/spec-schema";

import { createSavedListStore } from "./saved-list-store";

/** У таблиці порівняння вміщується чотири товари однієї категорії. */
export const COMPARE_LIMIT = 4;
/** Усього в порівнянні: по чотири товари в кожній категорії. */
export const COMPARE_TOTAL_LIMIT = COMPARE_LIMIT * COMPARE_CATEGORIES.length;
/** Обране без облікового запису живе в браузері, тож список обмежений. */
export const WISHLIST_LIMIT = 96;

export const wishlistStore = createSavedListStore({
  key: "sad:wishlist:v1",
  limit: WISHLIST_LIMIT,
});

export const compareStore = createSavedListStore({
  key: "sad:compare:v1",
  limit: COMPARE_TOTAL_LIMIT,
});

/* ── Категорії товарів у порівнянні ───────────────────────────────────── */

const CATEGORY_STORAGE_KEY = "sad:compare:categories:v1";
const CATEGORY_KEYS = new Set<string>(COMPARE_CATEGORIES.map((category) => category.key));

type CategoryMap = Record<string, CompareCategoryKey>;

/** Пам'ять на випадок, коли localStorage недоступний. */
let memory: CategoryMap = {};

function readCategories(): CategoryMap {
  try {
    if (typeof window === "undefined") return memory;
    const parsed: unknown = JSON.parse(window.localStorage.getItem(CATEGORY_STORAGE_KEY) ?? "null");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return memory;
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, CompareCategoryKey] =>
          typeof entry[1] === "string" && CATEGORY_KEYS.has(entry[1]),
      ),
    );
  } catch {
    return memory;
  }
}

function writeCategories(next: CategoryMap) {
  memory = next;
  try {
    if (Object.keys(next).length > 0) {
      window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(next));
    } else {
      window.localStorage.removeItem(CATEGORY_STORAGE_KEY);
    }
  } catch {
    // Сховище заблоковане: категорії лишаються в пам'яті до кінця відвідування.
  }
}

/** Скільки товарів категорії вже в порівнянні. Сам список handle — у compareStore. */
export function countCompared(category: CompareCategoryKey): number {
  const categories = readCategories();
  return compareStore.getSnapshot().filter((handle) => categories[handle] === category).length;
}

/**
 * Запам'ятовує категорію товару: за нею рахується ліміт «чотири в категорії» ще до того,
 * як сторінка порівняння завантажить товари. Записи про товари, яких у списку вже немає,
 * заодно прибираються.
 */
export function rememberCompareCategory(handle: string, category: CompareCategoryKey) {
  const current = readCategories();
  const kept: CategoryMap = {};
  for (const item of compareStore.getSnapshot()) {
    const known = current[item];
    if (known) kept[item] = known;
  }
  writeCategories({ ...kept, [handle]: category });
}
