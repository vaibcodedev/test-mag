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

async function openMenu() {
  render(
    <MemoryRouter>
      <MobileNav categories={CATEGORIES} />
    </MemoryRouter>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Відкрити меню" }));
}

describe("MobileNav", () => {
  it("має рядки «Порівняння» і «Кабінет» з посиланнями на свої сторінки", async () => {
    await openMenu();

    expect(screen.getByRole("link", { name: /^Порівняння/ })).toHaveAttribute("href", "/compare");
    expect(screen.getByRole("link", { name: "Кабінет" })).toHaveAttribute("href", "/account");
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
