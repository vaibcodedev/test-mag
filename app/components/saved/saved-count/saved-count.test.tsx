import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { compareStore, wishlistStore } from "~/lib/saved-lists";

import { CompareCount, SavedCount, WishlistCount } from "./saved-count";

beforeEach(() => {
  act(() => {
    wishlistStore.clear();
    compareStore.clear();
  });
});

describe("SavedCount", () => {
  it("показує число з підписом для зчитувача екрана", () => {
    render(<SavedCount count={3} label="Товарів в обраному" />);

    expect(
      screen.getByText("Товарів в обраному:", { exact: false }).parentElement,
    ).toHaveTextContent("Товарів в обраному: 3");
  });

  it("для нуля нічого не рендерить", () => {
    const { container } = render(<SavedCount count={0} label="Товарів в обраному" />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("WishlistCount і CompareCount", () => {
  it("порожні списки не дають розмітки", () => {
    const { container } = render(
      <>
        <WishlistCount />
        <CompareCount />
      </>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("стежать за своїми списками", () => {
    const { container } = render(
      <>
        <WishlistCount />
        <CompareCount />
      </>,
    );

    act(() => {
      wishlistStore.add("a");
      wishlistStore.add("b");
      compareStore.add("a");
    });
    expect(container).toHaveTextContent("Товарів в обраному: 2");
    expect(container).toHaveTextContent("Товарів у порівнянні: 1");

    act(() => {
      compareStore.clear();
    });
    expect(container).not.toHaveTextContent("Товарів у порівнянні");
  });

  it("на сервері нічого не рендерять, навіть коли список не порожній", () => {
    act(() => {
      wishlistStore.add("a");
      compareStore.add("a");
    });

    expect(
      renderToString(
        <>
          <WishlistCount />
          <CompareCount />
        </>,
      ),
    ).toBe("");
  });
});
