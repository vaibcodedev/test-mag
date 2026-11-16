import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./navigation-menu";

// Radix NavigationMenu міряє вміст через ResizeObserver, якого в jsdom немає.
beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

function Menu() {
  return (
    <NavigationMenu delayDuration={0}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Каталог</NavigationMenuTrigger>
          <NavigationMenuContent>
            <a href="/collections/iphone">iPhone</a>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const trigger = () => screen.getByRole("button", { name: "Каталог" });

/** Наведення мишею: Radix відкриває меню лише для pointerType "mouse". */
function hover(element: HTMLElement) {
  const init = { bubbles: true, pointerType: "mouse" };
  fireEvent.pointerEnter(element, init);
  fireEvent.pointerMove(element, init);
}

describe("NavigationMenuTrigger", () => {
  it("клік мишею по меню, відкритому за hover, лишає його відкритим; наступний клік закриває", async () => {
    render(<Menu />);

    hover(trigger());
    await waitFor(() => expect(trigger()).toHaveAttribute("aria-expanded", "true"));

    fireEvent.click(trigger(), { detail: 1 });
    expect(trigger()).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(trigger(), { detail: 1 });
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("клік без наведення відкриває меню", () => {
    render(<Menu />);

    fireEvent.click(trigger(), { detail: 1 });

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("з клавіатури Enter відкриває і закриває меню", async () => {
    render(<Menu />);
    const user = userEvent.setup();

    trigger().focus();
    await user.keyboard("{Enter}");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Enter}");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });
});
