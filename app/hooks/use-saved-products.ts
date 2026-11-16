import { useCallback, useEffect, useMemo, useState } from "react";

import {
  SAVED_PRODUCTS_PAGE_SIZE,
  SAVED_PRODUCTS_PATH,
  type SavedProduct,
  type SavedProductsResponse,
} from "~/lib/saved-lists";

type State = {
  /** Уже завантажені товари за handle. */
  products: ReadonlyMap<string, SavedProduct>;
  /** Handle, яких у магазині більше немає. */
  missing: readonly string[];
  failed: boolean;
};

const INITIAL: State = { products: new Map(), missing: [], failed: false };

async function fetchSavedProducts(handles: string[], signal: AbortSignal) {
  const pages: string[][] = [];
  for (let start = 0; start < handles.length; start += SAVED_PRODUCTS_PAGE_SIZE) {
    pages.push(handles.slice(start, start + SAVED_PRODUCTS_PAGE_SIZE));
  }

  const responses = await Promise.all(
    pages.map(async (page) => {
      const response = await fetch(
        `${SAVED_PRODUCTS_PATH}?handles=${page.map(encodeURIComponent).join(",")}`,
        { signal, headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw new Error(`Saved products: ${response.status}`);
      return (await response.json()) as SavedProductsResponse;
    }),
  );

  return responses.flatMap((response) => response.products);
}

export type UseSavedProductsOptions = {
  /** Товари, яких у магазині вже немає: їх варто прибрати зі списку. */
  onMissing?: (handles: readonly string[]) => void;
};

/**
 * Дані товарів для списку handle з браузера (обране, порівняння).
 * Завантажує лише ті товари, яких ще немає в пам'яті, тому видалення зі списку не робить запитів.
 */
export function useSavedProducts(
  handles: readonly string[],
  { onMissing }: UseSavedProductsOptions = {},
) {
  const [state, setState] = useState<State>(INITIAL);
  const [attempt, setAttempt] = useState(0);

  const pending = useMemo(
    () =>
      handles.filter((handle) => !state.products.has(handle) && !state.missing.includes(handle)),
    [handles, state.products, state.missing],
  );
  // Рядок замість масиву: ефект перезапускається лише тоді, коли змінився сам перелік.
  const pendingKey = pending.join(",");

  useEffect(() => {
    if (!pendingKey) return;
    const requested = pendingKey.split(",");
    const controller = new AbortController();

    fetchSavedProducts(requested, controller.signal)
      .then((loaded) => {
        const found = new Set(loaded.map((product) => product.handle));
        setState((current) => {
          const products = new Map(current.products);
          for (const product of loaded) products.set(product.handle, product);
          return {
            products,
            missing: [...current.missing, ...requested.filter((handle) => !found.has(handle))],
            failed: false,
          };
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState((current) => ({ ...current, failed: true }));
      });

    return () => controller.abort();
  }, [pendingKey, attempt]);

  // Зниклі товари прибираємо зі списку вже після того, як стан оновився: так не буде зайвого запиту.
  const missingInList = useMemo(
    () => state.missing.filter((handle) => handles.includes(handle)),
    [state.missing, handles],
  );
  const missingKey = missingInList.join(",");
  useEffect(() => {
    if (missingKey) onMissing?.(missingKey.split(","));
  }, [missingKey, onMissing]);

  const products = useMemo(
    () =>
      handles.flatMap((handle) => {
        const product = state.products.get(handle);
        return product ? [product] : [];
      }),
    [handles, state.products],
  );

  const retry = useCallback(() => {
    setState((current) => ({ ...current, failed: false }));
    setAttempt((value) => value + 1);
  }, []);

  return {
    /** Завантажені товари в порядку списку. */
    products,
    /** Скільки товарів ще завантажується: стільки показати заглушок. */
    pendingCount: state.failed ? 0 : pending.length,
    loading: pending.length > 0 && !state.failed,
    /** Запит не вдався; retry() повторює його. */
    failed: state.failed && pending.length > 0,
    retry,
  };
}
