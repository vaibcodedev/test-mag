import { createSavedListStore } from "./saved-list-store";

/** У таблиці порівняння вміщується чотири товари. */
export const COMPARE_LIMIT = 4;
/** Обране без облікового запису живе в браузері, тож список обмежений. */
export const WISHLIST_LIMIT = 96;

export const wishlistStore = createSavedListStore({
  key: "sad:wishlist:v1",
  limit: WISHLIST_LIMIT,
});

export const compareStore = createSavedListStore({
  key: "sad:compare:v1",
  limit: COMPARE_LIMIT,
});
