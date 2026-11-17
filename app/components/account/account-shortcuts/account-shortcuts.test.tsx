import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";

import { compareStore, wishlistStore } from "~/lib/saved-lists";

import { AccountShortcuts, AccountShortcutsView } from "./account-shortcuts";

beforeEach(() => {
  act(() => {
    wishlistStore.clear();
    compareStore.clear();
  });
});

describe("AccountShortcutsView", () => {
  it("веде в обране, порівняння й кошик і називає лічильники словами", () => {
    render(
      <MemoryRouter>
        <AccountShortcutsView wishlistCount={3} compareCount={0} cartCount={12} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Швидкий доступ" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Обране: 3 товари" })).toHaveAttribute(
      "href",
      "/wishlist",
    );
    expect(screen.getByRole("link", { name: "Порівняння" })).toHaveAttribute("href", "/compare");
    expect(screen.getByRole("link", { name: "Кошик: 12 товарів" })).toHaveAttribute(
      "href",
      "/cart",
    );
  });
});

describe("AccountShortcuts", () => {
  it("стежить за обраним і порівнянням у браузері; без CartProvider кошик порожній", () => {
    render(
      <MemoryRouter>
        <AccountShortcuts />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Обране" })).toBeInTheDocument();

    act(() => {
      wishlistStore.add("a");
      wishlistStore.add("b");
      compareStore.add("a");
    });

    expect(screen.getByRole("link", { name: "Обране: 2 товари" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Порівняння: 1 товар" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Кошик" })).toBeInTheDocument();
  });
});
