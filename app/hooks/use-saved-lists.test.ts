import { act, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "~/components/ui/sonner";
import { registerAppNavigate } from "~/lib/app-navigate";
import { COMPARE_LIMIT, compareStore, wishlistStore } from "~/lib/saved-lists";

import { compareFullMessage, OPEN_COMPARE_ACTION, useCompare, useIsCompared } from "./use-compare";
import { OPEN_WISHLIST_ACTION, useIsWishlisted, useWishlist } from "./use-wishlist";

vi.mock("~/components/ui/sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), warning: vi.fn(), error: vi.fn() }),
}));

beforeEach(() => {
  act(() => {
    wishlistStore.clear();
    compareStore.clear();
  });
  localStorage.clear();
  vi.clearAllMocks();
});

describe("useWishlist", () => {
  it("додає й прибирає товар і показує сповіщення", () => {
    const { result } = renderHook(() => useWishlist());
    expect(result.current.handles).toEqual([]);

    act(() => {
      result.current.toggle("iphone-17");
    });
    expect(result.current.handles).toEqual(["iphone-17"]);
    expect(result.current.count).toBe(1);
    expect(toast.success).toHaveBeenCalledWith("Додано в обране", {
      action: expect.objectContaining({ label: "Відкрити обране" }),
    });
    expect(localStorage.getItem(wishlistStore.key)).toBe('["iphone-17"]');

    act(() => {
      result.current.toggle("iphone-17");
    });
    expect(result.current.handles).toEqual([]);
    expect(toast).toHaveBeenCalledWith("Прибрано з обраного");
  });

  it("remove і clear працюють без сповіщень", () => {
    const { result } = renderHook(() => useWishlist());
    act(() => {
      result.current.toggle("a");
      result.current.toggle("b");
    });
    vi.clearAllMocks();

    act(() => result.current.remove("a"));
    expect(result.current.handles).toEqual(["b"]);
    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
    expect(toast).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("оновлюється, коли список змінила інша вкладка", () => {
    const { result } = renderHook(() => useWishlist());

    act(() => {
      localStorage.setItem(wishlistStore.key, '["mac"]');
      window.dispatchEvent(new StorageEvent("storage", { key: wishlistStore.key }));
    });

    expect(result.current.handles).toEqual(["mac"]);
  });

  it("на сервері список порожній, навіть якщо у сторі вже є товари", () => {
    act(() => {
      wishlistStore.add("mac");
    });

    const html = renderToString(
      createElement(function Probe() {
        return `${useWishlist().count}:${useIsWishlisted("mac")}`;
      }),
    );

    expect(html).toBe("0:false");
  });
});

describe("useIsWishlisted", () => {
  it("відповідає лише за свій товар", () => {
    const { result } = renderHook(() => useIsWishlisted("a"));
    expect(result.current).toBe(false);

    act(() => {
      wishlistStore.add("b");
    });
    expect(result.current).toBe(false);

    act(() => {
      wishlistStore.add("a");
    });
    expect(result.current).toBe(true);
  });
});

describe("useCompare", () => {
  it("не додає п'ятий товар і пояснює чому", () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      for (const handle of ["a", "b", "c", "d"]) result.current.toggle(handle, "iphone");
    });
    expect(result.current.count).toBe(COMPARE_LIMIT);
    expect(toast.success).toHaveBeenCalledWith("Додано до порівняння", {
      action: expect.objectContaining({ label: "Відкрити порівняння" }),
    });

    let outcome: string | undefined;
    act(() => {
      outcome = result.current.toggle("e", "iphone");
    });
    expect(outcome).toBe("full");
    expect(result.current.handles).toEqual(["a", "b", "c", "d"]);
    expect(compareFullMessage("iphone")).toBe(
      "У порівнянні вже 4 товари категорії iPhone. Приберіть один, щоб додати новий.",
    );
    expect(toast.warning).toHaveBeenCalledWith(compareFullMessage("iphone"));
  });

  it("ліміт рахується окремо в кожній категорії", () => {
    const { result } = renderHook(() => useCompare());

    act(() => {
      for (const handle of ["a", "b", "c", "d"]) result.current.toggle(handle, "iphone");
    });

    let outcome: string | undefined;
    act(() => {
      outcome = result.current.toggle("macbook", "mac");
    });
    expect(outcome).toBe("added");
    expect(result.current.handles).toEqual(["a", "b", "c", "d", "macbook"]);

    // Прибрали один iPhone — місце в категорії звільнилося.
    act(() => {
      result.current.remove("a");
    });
    act(() => {
      outcome = result.current.toggle("e", "iphone");
    });
    expect(outcome).toBe("added");
  });

  it("прибирає товар із порівняння", () => {
    const { result } = renderHook(() => useCompare());
    const compared = renderHook(() => useIsCompared("a"));

    act(() => {
      result.current.toggle("a", "iphone");
    });
    expect(compared.result.current).toBe(true);

    act(() => {
      result.current.toggle("a", "iphone");
    });
    expect(compared.result.current).toBe(false);
    expect(toast).toHaveBeenCalledWith("Прибрано з порівняння");
  });
});

describe("дії в тостах", () => {
  it("«Відкрити порівняння» і «Відкрити обране» ведуть на свої сторінки через роутер", () => {
    const navigate = vi.fn();
    const unregister = registerAppNavigate(navigate);

    OPEN_COMPARE_ACTION.onClick();
    OPEN_WISHLIST_ACTION.onClick();

    expect(navigate).toHaveBeenNthCalledWith(1, "/compare");
    expect(navigate).toHaveBeenNthCalledWith(2, "/wishlist");
    unregister();
  });
});
