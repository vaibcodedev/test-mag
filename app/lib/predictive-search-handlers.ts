import { createPredictiveSearchServerHandlers } from "@shopify/hydrogen";

import { PREDICTIVE_SEARCH_TYPES } from "~/lib/predictive-search";

// Типові типи підказок збігаються з тими, які просить поле пошуку
// (app/components/search/predictive-search): запити, товари й колекції.
// Посилання підказок ведуть на /search?q=…, /products/… і /collections/… — усі ці сторінки є.
export const predictiveSearchHandlers = createPredictiveSearchServerHandlers({
  types: [...PREDICTIVE_SEARCH_TYPES],
});
