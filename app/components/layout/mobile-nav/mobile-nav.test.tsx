import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { compareStore } from "~/lib/saved-lists";

import { MobileNav } from "./mobile-nav";

vi.mock("~/components/ui/sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), warning: vi.fn(), error: vi.fn() }),
}));

const CATEGORIES = [{ title: "iPhone", to: "/collections/iphone" }];

beforeEach(() => {
  act(() => compareStore.clear());
  localStorage.clear();
});

async function openMenu(signedIn = false) {
  render(
    <MemoryRouter>
      <MobileNav categories={CATEGORIES} signedIn={signedIn} />
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Відкрити меню" }));
}

describe("MobileNav", () => {
  it("має рядки «Порівняння» і «Кабінет» з посиланнями на свої сторінки", async () => {
    await openMenu();

    expect(screen.getByRole("link", { name: /^Порівняння/ })).toHaveAttribute("href", "/compare");
    // Гостю пункт меню каже, що робити: увійти.
    expect(screen.getByRole("link", { name: "Увійти до кабінету" })).toHaveAttribute(
      "href",
      "/account",
    );
  });

  it("покупцеві, який увійшов, показує «Мій кабінет»", async () => {
    await openMenu(true);

    expect(screen.getByRole("link", { name: "Мій кабінет" })).toHaveAttribute("href", "/account");
    expect(screen.queryByRole("link", { name: "Увійти до кабінету" })).toBeNull();
  });

  it("показує кількість товарів у порівнянні", async () => {
    act(() => {
      compareStore.toggle("iphone-17");
      compareStore.toggle("iphone-air");
    });
    await openMenu();

    const link = screen.getByRole("link", { name: /^Порівняння/ });
    expect(link).toHaveAttribute("href", "/compare");
    expect(link).toHaveTextContent("Товарів у порівнянні: 2");
  });
});
