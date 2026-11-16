import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it } from "vitest";

import { CartProvider } from "~/lib/cart";
import { isCartDrawerOpen, openCartDrawer, openCartDrawerFromLinkClick } from "~/lib/cart-drawer";

import { CartDrawer } from "./cart-drawer";

type InitialData = ComponentProps<typeof CartProvider>["initialData"];

const uah = (amount: string) => ({ amount, currencyCode: "UAH" });

const CART_WITH_LINE = {
  cart: {
    id: "gid://shopify/Cart/demo",
    updatedAt: "2026-11-16T10:00:00Z",
    checkoutUrl: "https://sad.example/checkout/demo",
    totalQuantity: 2,
    note: null,
    attributes: [],
    cost: {
      subtotalAmount: uah("129998.0"),
      totalAmount: uah("129998.0"),
      checkoutChargeAmount: uah("129998.0"),
    },
    lines: {
      nodes: [
        {
          id: "gid://shopify/CartLine/1",
          quantity: 2,
          attributes: [],
          cost: {
            totalAmount: uah("129998.0"),
            subtotalAmount: uah("129998.0"),
            amountPerQuantity: uah("64999.0"),
            compareAtAmountPerQuantity: null,
          },
          merchandise: {
            id: "gid://shopify/ProductVariant/1",
            title: "256 ГБ",
            sku: null,
            image: null,
            product: {
              id: "gid://shopify/Product/1",
              title: "iPhone 17 Pro",
              handle: "iphone-17-pro",
              vendor: "Apple",
              productType: "Смартфон",
            },
            selectedOptions: [{ name: "Пам'ять", value: "256 ГБ" }],
          },
          sellingPlanAllocation: null,
          parentRelationship: null,
        },
      ],
    },
    discountCodes: [],
  },
} as unknown as InitialData;

const EMPTY_CART = { cart: null } as unknown as InitialData;

/** Запас часу на перше завантаження чанка панелі під навантаженням повного прогону. */
const LAZY_CHUNK_TIMEOUT = 30_000;
/** Панель показується після Suspense: чекаємо довше за типову секунду Testing Library. */
const DIALOG_TIMEOUT = { timeout: 4000 };

// Обробник, який панель передала в window.Shopify.actions.openCart.configure().
let openCartHandler: (() => Promise<void>) | undefined;

function renderDrawer(initialData: InitialData) {
  return render(
    <MemoryRouter>
      <CartProvider initialData={initialData}>
        {/* jsdom не вміє переходити за посиланнями: гасимо перехід уже після обробника кошика. */}
        <div role="presentation" onClick={(event) => event.preventDefault()}>
          <a href="/cart" onClick={openCartDrawerFromLinkClick}>
            Відкрити кошик
          </a>
        </div>
        <CartDrawer />
      </CartProvider>
    </MemoryRouter>,
  );
}

describe("CartDrawer", () => {
  beforeAll(async () => {
    // Панель вантажиться через React.lazy. Завантажуємо її чанк наперед, щоб у повному прогоні
    // перше відкриття не чекало на трансформацію модуля довше, ніж триває findByRole.
    await import("./cart-drawer-panel");

    // Мінімум Standard Actions: панель має зареєструвати себе як обробник openCart.
    const configure = ({ handler }: { handler: () => Promise<void> }) => {
      openCartHandler = handler;
    };
    Object.assign(window, { Shopify: { actions: { openCart: { configure } } } });
  }, LAZY_CHUNK_TIMEOUT);

  it("до кліку панелі в DOM немає, посилання веде на /cart", () => {
    renderDrawer(EMPTY_CART);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Відкрити кошик" })).toHaveAttribute("href", "/cart");
  });

  it("клік по посиланню відкриває панель із рядками, сумою та оформленням", async () => {
    renderDrawer(CART_WITH_LINE);
    const user = userEvent.setup();

    await user.click(screen.getByRole("link", { name: "Відкрити кошик" }));
    const dialog = await screen.findByRole("dialog", { name: "Кошик" }, DIALOG_TIMEOUT);

    expect(within(dialog).getByText("2 товари")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "iPhone 17 Pro" })).toBeInTheDocument();
    expect(within(dialog).getByRole("textbox", { name: "Кількість" })).toHaveValue("2");
    expect(within(dialog).getByRole("link", { name: "Оформити замовлення" })).toHaveAttribute(
      "href",
      "https://sad.example/checkout/demo",
    );
    expect(within(dialog).getByRole("button", { name: "Продовжити покупки" })).toBeInTheDocument();
    expect(dialog.querySelector("hydrogen-shop-pay-button")).not.toBeNull();
  });

  it("після відкриття фокус стоїть на заголовку, а не на кнопці, що прибирає товар", async () => {
    renderDrawer(CART_WITH_LINE);
    const user = userEvent.setup();

    await user.click(screen.getByRole("link", { name: "Відкрити кошик" }));
    const dialog = await screen.findByRole("dialog", { name: "Кошик" }, DIALOG_TIMEOUT);

    await waitFor(() => expect(within(dialog).getByText("Кошик")).toHaveFocus());
    expect(within(dialog).getByRole("button", { name: "Зменшити кількість" })).not.toHaveFocus();
  });

  it("порожній кошик: запрошення до каталогу, без суми й оформлення", async () => {
    renderDrawer(EMPTY_CART);
    const user = userEvent.setup();

    await user.click(screen.getByRole("link", { name: "Відкрити кошик" }));
    const dialog = await screen.findByRole("dialog", { name: "Кошик" }, DIALOG_TIMEOUT);

    expect(within(dialog).getByText("У кошику поки порожньо")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "Перейти до каталогу" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("link", { name: "Оформити замовлення" })).toBeNull();
    expect(dialog.querySelector("hydrogen-shop-pay-button")).toBeNull();
  });

  it("Escape закриває панель і повертає фокус на кнопку кошика", async () => {
    renderDrawer(EMPTY_CART);
    const user = userEvent.setup();
    const trigger = screen.getByRole("link", { name: "Відкрити кошик" });

    await user.click(trigger);
    await screen.findByRole("dialog", { name: "Кошик" }, DIALOG_TIMEOUT);
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(isCartDrawerOpen()).toBe(false);
    expect(trigger).toHaveFocus();
  });

  it("Ctrl+клік не перехоплюється: посилання відкриється в новій вкладці", async () => {
    renderDrawer(EMPTY_CART);
    const user = userEvent.setup();

    await user.keyboard("{Control>}");
    await user.click(screen.getByRole("link", { name: "Відкрити кошик" }));
    await user.keyboard("{/Control}");

    expect(isCartDrawerOpen()).toBe(false);
  });

  it("window.Shopify.actions.openCart() відкриває панель", async () => {
    renderDrawer(EMPTY_CART);

    expect(openCartHandler).toBeTypeOf("function");
    await act(async () => {
      await openCartHandler?.();
    });

    expect(
      await screen.findByRole("dialog", { name: "Кошик" }, DIALOG_TIMEOUT),
    ).toBeInTheDocument();
  });

  it("без змонтованої панелі openCartDrawer нічого не робить", () => {
    openCartDrawer();

    expect(isCartDrawerOpen()).toBe(false);
  });
});
