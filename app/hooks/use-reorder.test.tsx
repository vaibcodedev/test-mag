import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "~/components/ui/sonner";
import type { ReorderPlan } from "~/lib/account/reorder";
import { isCartAddLocked, resetCartAddLock } from "~/lib/cart-add-lock";
import { openCartDrawer } from "~/lib/cart-drawer";

import { useReorder } from "./use-reorder";

vi.mock("~/components/ui/sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), warning: vi.fn(), error: vi.fn() }),
}));

vi.mock("~/lib/cart-drawer", () => ({ openCartDrawer: vi.fn() }));

/** Стан стору кошика, який бачить хук. `undefined` — хук поза CartProvider. */
let cartState: { loading: boolean; readyPromise?: PromiseLike<void> } | undefined;

vi.mock("~/lib/cart", () => ({
  useOptionalCart: <T,>(selector: (state: NonNullable<typeof cartState>) => T) =>
    cartState ? selector(cartState) : undefined,
}));

const ORDER_ID = "gid://shopify/Order/1005";

function planLine(id: number, quantity = 1): ReorderPlan["lines"][number] {
  const merchandiseId = `gid://shopify/ProductVariant/${id}`;
  return {
    merchandiseId,
    quantity,
    preview: {
      id: merchandiseId,
      price: { amount: "100.0", currencyCode: "UAH" },
      title: "Default Title",
      image: null,
      selectedOptions: [],
      product: { title: `Товар ${id}`, handle: `product-${id}` },
    },
  };
}

const FULL: ReorderPlan = { lines: [planLine(1, 2), planLine(2)], skipped: [] };
const PARTIAL: ReorderPlan = {
  lines: [planLine(1)],
  skipped: [{ title: "Годинник", reason: "sold-out" }],
};
const NOTHING: ReorderPlan = { lines: [], skipped: [{ title: "Годинник", reason: "gone" }] };

const CART = {
  id: "gid://shopify/Cart/1",
  totalQuantity: 3,
  cost: { totalAmount: { amount: "300.0", currencyCode: "UAH" } },
  lines: { nodes: [] },
  discountCodes: [],
};

function mockUpdateCart(implementation: (...args: unknown[]) => Promise<unknown>) {
  const updateCart = Object.assign(vi.fn(implementation), {
    isDefault: vi.fn(() => false),
    configure: vi.fn(() => true),
  });
  window.Shopify = { actions: { updateCart } } as unknown as Window["Shopify"];
  return updateCart;
}

function mockPlan(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((onResolve) => {
    resolve = onResolve;
  });
  return { promise, resolve };
}

beforeEach(() => {
  cartState = { loading: false };
  resetCartAddLock();
  vi.clearAllMocks();
});

afterEach(() => {
  delete window.Shopify;
  vi.unstubAllGlobals();
});

describe("useReorder", () => {
  it("додає всі рядки плану одним викликом і відкриває кошик без тосту", async () => {
    const fetchMock = mockPlan(FULL);
    const updateCart = mockUpdateCart(async () => ({ cart: CART }));
    const { result } = renderHook(() => useReorder());

    await act(() => result.current.reorder(ORDER_ID));

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/account/orders/1005/reorder", {
      headers: { Accept: "application/json" },
    });
    expect(updateCart).toHaveBeenCalledExactlyOnceWith(
      {
        lines: [
          { merchandiseId: "gid://shopify/ProductVariant/1", quantity: 2 },
          { merchandiseId: "gid://shopify/ProductVariant/2", quantity: 1 },
        ],
      },
      { event: { detail: { products: FULL.lines.map((line) => line.preview) } } },
    );
    expect(openCartDrawer).toHaveBeenCalledOnce();
    expect(toast.warning).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(result.current.outcome?.message).toEqual({
      tone: "success",
      title: "Товари додано в кошик",
    });
    expect(result.current.pending).toBe(false);
    expect(isCartAddLocked()).toBe(false);
  });

  it("частковий результат: кошик відкривається, пропущені позиції названо", async () => {
    mockPlan(PARTIAL);
    mockUpdateCart(async () => ({ cart: CART }));
    const { result } = renderHook(() => useReorder());

    await act(() => result.current.reorder(ORDER_ID));

    expect(openCartDrawer).toHaveBeenCalledOnce();
    expect(toast.warning).toHaveBeenCalledExactlyOnceWith("Додано не все", {
      description: "Закінчився: «Годинник». Решта вже в кошику.",
    });
  });

  it("нічого додати не можна: кошик не чіпаємо й не відкриваємо", async () => {
    mockPlan(NOTHING);
    const updateCart = mockUpdateCart(async () => ({ cart: CART }));
    const { result } = renderHook(() => useReorder());

    await act(() => result.current.reorder(ORDER_ID));

    expect(updateCart).not.toHaveBeenCalled();
    expect(openCartDrawer).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledExactlyOnceWith("Нічого не додано", {
      description: expect.stringMatching(/Більше не продається: «Годинник»/),
    });
    expect(result.current.outcome?.openCart).toBe(false);
  });

  it("попередження кошика про кількість: відкриває кошик і просить перевірити", async () => {
    mockPlan(FULL);
    mockUpdateCart(async () => ({
      cart: CART,
      warnings: [{ message: "Only 1 left", code: "MERCHANDISE_NOT_ENOUGH_STOCK" }],
    }));
    const { result } = renderHook(() => useReorder());

    await act(() => result.current.reorder(ORDER_ID));

    expect(openCartDrawer).toHaveBeenCalledOnce();
    expect(toast.warning).toHaveBeenCalledExactlyOnceWith("Додано не все", {
      description: expect.stringMatching(/перевірте кошик/),
    });
  });

  it("відмова магазину й збій мережі: помилка українською, кошик закритий", async () => {
    mockPlan(FULL);
    mockUpdateCart(async () => ({
      cart: CART,
      userErrors: [{ message: "Merchandise is out of stock" }],
    }));
    const { result } = renderHook(() => useReorder());

    await act(() => result.current.reorder(ORDER_ID));
    expect(toast.error).toHaveBeenLastCalledWith("Не вдалося додати товари", {
      description: expect.stringMatching(/Магазин не прийняв товари/),
    });

    mockUpdateCart(async () => {
      throw new Error("Failed to fetch");
    });
    await act(() => result.current.reorder(ORDER_ID));
    expect(toast.error).toHaveBeenLastCalledWith("Не вдалося повторити замовлення", {
      description: expect.stringMatching(/Перевірте з'єднання/),
    });

    expect(openCartDrawer).not.toHaveBeenCalled();
    expect(isCartAddLocked()).toBe(false);
  });

  it("сервер не віддав план: 401 просить увійти, інший збій — спробувати ще раз", async () => {
    const updateCart = mockUpdateCart(async () => ({ cart: CART }));
    const { result } = renderHook(() => useReorder());

    mockPlan({ error: "Увійдіть" }, 401);
    await act(() => result.current.reorder(ORDER_ID));
    expect(toast.error).toHaveBeenLastCalledWith("Увійдіть у кабінет ще раз", expect.anything());

    mockPlan({ error: "Збій" }, 502);
    await act(() => result.current.reorder(ORDER_ID));
    expect(toast.error).toHaveBeenLastCalledWith(
      "Не вдалося повторити замовлення",
      expect.anything(),
    );

    mockPlan({ unexpected: true });
    await act(() => result.current.reorder(ORDER_ID));
    expect(toast.error).toHaveBeenCalledTimes(3);

    expect(updateCart).not.toHaveBeenCalled();
    expect(openCartDrawer).not.toHaveBeenCalled();
  });

  it("повторне натискання, доки триває запит, нічого не надсилає", async () => {
    const response = deferred<Response>();
    const fetchMock = vi.fn(() => response.promise);
    vi.stubGlobal("fetch", fetchMock);
    const updateCart = mockUpdateCart(async () => ({ cart: CART }));
    const { result } = renderHook(() => useReorder());

    let first!: Promise<void>;
    act(() => {
      first = result.current.reorder(ORDER_ID);
      void result.current.reorder(ORDER_ID);
    });
    expect(result.current.pending).toBe(true);
    await act(() => result.current.reorder(ORDER_ID));

    expect(fetchMock).toHaveBeenCalledOnce();

    await act(async () => {
      response.resolve(Response.json(FULL));
      await first;
    });

    expect(updateCart).toHaveBeenCalledOnce();
    expect(result.current.pending).toBe(false);
  });

  it("без скриптів Shopify і з незрозумілим ідентифікатором нікуди не ходить", async () => {
    const fetchMock = mockPlan(FULL);
    const { result } = renderHook(() => useReorder());

    await act(() => result.current.reorder(ORDER_ID));
    await act(() => result.current.reorder("gid://shopify/Order/abc"));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(2);
    expect(openCartDrawer).not.toHaveBeenCalled();
  });
});
