import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProductCardData } from "~/components/product/product-card";
import { toast } from "~/components/ui/sonner";
import { holdCartAddLock, isCartAddLocked, resetCartAddLock } from "~/lib/cart-add-lock";

import { useAddToCart } from "./use-add-to-cart";

vi.mock("~/components/ui/sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), warning: vi.fn(), error: vi.fn() }),
}));

/** Стан стору кошика, який бачить хук. `undefined` — хук поза CartProvider. */
let cartState: { loading: boolean; readyPromise?: PromiseLike<void> } | undefined;

vi.mock("~/lib/cart", () => ({
  useOptionalCart: <T,>(selector: (state: NonNullable<typeof cartState>) => T) =>
    cartState ? selector(cartState) : undefined,
}));

const PRODUCT: ProductCardData = {
  handle: "iphone-17",
  variantId: "gid://shopify/ProductVariant/17",
  title: "iPhone 17",
  image: { url: "https://cdn.shopify.com/iphone.png", altText: null, width: 800, height: 800 },
  price: { amount: "44999.0", currencyCode: "UAH" },
  availableForSale: true,
};
const SECOND: ProductCardData = {
  ...PRODUCT,
  handle: "airpods",
  variantId: "gid://shopify/ProductVariant/2",
  title: "AirPods",
};

const CART = {
  id: "gid://shopify/Cart/1",
  totalQuantity: 1,
  cost: { totalAmount: { amount: "44999.0", currencyCode: "UAH" } },
  lines: { nodes: [] },
  discountCodes: [],
};

type UpdateCartMock = ReturnType<typeof vi.fn> & { isDefault: ReturnType<typeof vi.fn> };

/** Підставляє `window.Shopify.actions.updateCart`. `isDefault() === false` — стор уже під'єднався. */
function mockUpdateCart(implementation: (...args: unknown[]) => Promise<unknown>): UpdateCartMock {
  const updateCart = Object.assign(vi.fn(implementation), {
    isDefault: vi.fn(() => false),
    configure: vi.fn(() => true),
  });
  window.Shopify = { actions: { updateCart } } as unknown as Window["Shopify"];
  return updateCart;
}

let pathname = "/";
function LocationProbe() {
  pathname = useLocation().pathname;
  return null;
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <LocationProbe />
      <Routes>
        <Route path="*" element={children} />
      </Routes>
    </MemoryRouter>
  );
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  cartState = { loading: false };
  pathname = "/";
  resetCartAddLock();
  vi.clearAllMocks();
});

afterEach(() => {
  delete window.Shopify;
  vi.useRealTimers();
});

describe("useAddToCart", () => {
  it("додає варіант картки з попереднім переглядом рядка й показує «Додано в кошик»", async () => {
    const updateCart = mockUpdateCart(async () => ({ cart: CART }));
    const { result } = renderHook(() => useAddToCart(), { wrapper });

    await act(() => result.current.addToCart(PRODUCT));

    expect(updateCart).toHaveBeenCalledExactlyOnceWith(
      { lines: [{ merchandiseId: "gid://shopify/ProductVariant/17", quantity: 1 }] },
      {
        event: {
          detail: {
            products: [
              {
                id: "gid://shopify/ProductVariant/17",
                price: PRODUCT.price,
                title: "iPhone 17",
                image: PRODUCT.image,
                selectedOptions: [],
                product: { title: "iPhone 17", handle: "iphone-17" },
              },
            ],
          },
        },
      },
    );
    expect(toast.success).toHaveBeenCalledExactlyOnceWith("Додано в кошик", {
      description: "iPhone 17",
    });
    expect(toast.error).not.toHaveBeenCalled();
    expect(result.current.addingHandle).toBeNull();
    expect(isCartAddLocked()).toBe(false);
  });

  it("userErrors у відповіді: помилка українською, без «Додано в кошик»", async () => {
    mockUpdateCart(async () => ({
      cart: CART,
      userErrors: [{ message: "Merchandise is out of stock", code: "INVALID" }],
    }));
    const { result } = renderHook(() => useAddToCart(), { wrapper });

    await act(() => result.current.addToCart(PRODUCT));

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledExactlyOnceWith("Не вдалося додати товар", {
      description: expect.stringMatching(/Магазин не прийняв цей товар/),
    });
  });

  it("warnings у відповіді: повідомлення про проблему, без «Додано в кошик»", async () => {
    mockUpdateCart(async () => ({
      cart: CART,
      warnings: [{ message: "Only 1 left", code: "MERCHANDISE_NOT_ENOUGH_STOCK" }],
    }));
    const { result } = renderHook(() => useAddToCart(), { wrapper });

    await act(() => result.current.addToCart(PRODUCT));

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledExactlyOnceWith("Товар додано не повністю", {
      description: expect.stringMatching(/Перевірте кошик/),
    });
  });

  it("відхилений запит: помилка мережі, а з userErrors у cause — відмова магазину", async () => {
    mockUpdateCart(async () => {
      throw new Error("Failed to fetch");
    });
    const { result } = renderHook(() => useAddToCart(), { wrapper });

    await act(() => result.current.addToCart(PRODUCT));

    expect(toast.error).toHaveBeenLastCalledWith("Не вдалося додати товар", {
      description: expect.stringMatching(/Перевірте з'єднання/),
    });

    mockUpdateCart(async () => {
      throw new Error("Cart error", { cause: { userErrors: [{ message: "Invalid" }] } });
    });
    await act(() => result.current.addToCart(PRODUCT));

    expect(toast.error).toHaveBeenLastCalledWith("Не вдалося додати товар", {
      description: expect.stringMatching(/Магазин не прийняв цей товар/),
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(isCartAddLocked()).toBe(false);
  });

  it("без варіанта («від» у картці) або без скриптів Shopify веде на сторінку товару", async () => {
    const updateCart = mockUpdateCart(async () => ({ cart: CART }));
    const { result } = renderHook(() => useAddToCart(), { wrapper });

    await act(() => result.current.addToCart({ ...PRODUCT, variantId: null, priceFrom: true }));

    expect(updateCart).not.toHaveBeenCalled();
    expect(pathname).toBe("/products/iphone-17");

    delete window.Shopify;
    await act(() => result.current.addToCart(SECOND));

    expect(pathname).toBe("/products/airpods");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("чекає, доки стор кошика налаштує updateCart (isDefault() === false)", async () => {
    const updateCart = mockUpdateCart(async () => ({ cart: CART }));
    updateCart.isDefault.mockReturnValue(true);
    const { result } = renderHook(() => useAddToCart(), { wrapper });

    let done = false;
    act(() => {
      void result.current.addToCart(PRODUCT).then(() => (done = true));
    });
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(updateCart).not.toHaveBeenCalled();
    expect(result.current.addingHandle).toBe("iphone-17");

    updateCart.isDefault.mockReturnValue(false);
    await waitFor(() => expect(done).toBe(true));

    expect(updateCart).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledOnce();
  });

  it("чекає, доки завершиться перше завантаження кошика", async () => {
    const updateCart = mockUpdateCart(async () => ({ cart: CART }));
    cartState = { loading: true, readyPromise: new Promise(() => {}) };
    const { result, rerender } = renderHook(() => useAddToCart(), { wrapper });

    let done = false;
    act(() => {
      void result.current.addToCart(PRODUCT).then(() => (done = true));
    });
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(updateCart).not.toHaveBeenCalled();

    cartState = { loading: false };
    rerender();
    await waitFor(() => expect(done).toBe(true));

    expect(updateCart).toHaveBeenCalledOnce();
  });

  it("якщо стор так і не став готовим, нічого не надсилає й пояснює, що робити", async () => {
    vi.useFakeTimers();
    const updateCart = mockUpdateCart(async () => ({ cart: CART }));
    updateCart.isDefault.mockReturnValue(true);
    const { result } = renderHook(() => useAddToCart(), { wrapper });

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.addToCart(PRODUCT);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000);
      await pending;
    });

    expect(updateCart).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledExactlyOnceWith("Не вдалося додати товар", {
      description: expect.stringMatching(/Кошик ще завантажується/),
    });
    expect(result.current.addingHandle).toBeNull();
  });

  it("поза CartProvider стор вважається не готовим: updateCart не викликається", async () => {
    vi.useFakeTimers();
    cartState = undefined;
    const updateCart = mockUpdateCart(async () => ({ cart: CART }));
    const { result } = renderHook(() => useAddToCart(), { wrapper });

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.addToCart(PRODUCT);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000);
      await pending;
    });

    expect(updateCart).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledOnce();
  });

  it("два хуки на сторінці: друге додавання чекає, доки перше отримає відповідь", async () => {
    const first = deferred<unknown>();
    const updateCart = mockUpdateCart(vi.fn());
    updateCart.mockImplementationOnce(() => first.promise);
    updateCart.mockImplementationOnce(async () => ({ cart: CART }));

    const one = renderHook(() => useAddToCart(), { wrapper });
    const two = renderHook(() => useAddToCart(), { wrapper });

    let firstDone!: Promise<void>;
    let secondDone!: Promise<void>;
    act(() => {
      firstDone = one.result.current.addToCart(PRODUCT);
      secondDone = two.result.current.addToCart(SECOND);
    });
    await waitFor(() => expect(updateCart).toHaveBeenCalledOnce());
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Перше додавання ще створює кошик: друге не надіслано.
    expect(updateCart).toHaveBeenCalledOnce();
    expect(updateCart.mock.calls[0]?.[0]).toEqual({
      lines: [{ merchandiseId: PRODUCT.variantId, quantity: 1 }],
    });
    expect(isCartAddLocked()).toBe(true);

    await act(async () => {
      first.resolve({ cart: CART });
      await firstDone;
      await secondDone;
    });

    expect(updateCart).toHaveBeenCalledTimes(2);
    expect(updateCart.mock.calls[1]?.[0]).toEqual({
      lines: [{ merchandiseId: SECOND.variantId, quantity: 1 }],
    });
    expect(toast.success).toHaveBeenCalledTimes(2);
    expect(isCartAddLocked()).toBe(false);
  });

  it("чекає й на форму сторінки товару, яка тримає спільний замок", async () => {
    const updateCart = mockUpdateCart(async () => ({ cart: CART }));
    const release = holdCartAddLock();
    const { result } = renderHook(() => useAddToCart(), { wrapper });

    let done!: Promise<void>;
    act(() => {
      done = result.current.addToCart(PRODUCT);
    });
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(updateCart).not.toHaveBeenCalled();

    await act(async () => {
      release();
      await done;
    });

    expect(updateCart).toHaveBeenCalledOnce();
  });

  it("повторне натискання в тому самому списку, поки товар додається, ігнорується", async () => {
    const first = deferred<unknown>();
    const updateCart = mockUpdateCart(() => first.promise);
    const { result } = renderHook(() => useAddToCart(), { wrapper });

    let firstDone!: Promise<void>;
    act(() => {
      firstDone = result.current.addToCart(PRODUCT);
    });
    await waitFor(() => expect(result.current.addingHandle).toBe("iphone-17"));
    await act(() => result.current.addToCart(SECOND));

    await act(async () => {
      first.resolve({ cart: CART });
      await firstDone;
    });

    expect(updateCart).toHaveBeenCalledOnce();
  });
});
