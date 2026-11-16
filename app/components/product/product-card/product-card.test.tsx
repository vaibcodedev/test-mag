import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "~/components/ui/sonner";
import { compareStore, wishlistStore } from "~/lib/saved-lists";

import { ProductCard, type ProductCardProps } from "./product-card";
import { ProductCardSkeleton } from "./product-card-skeleton";
import type { ProductCardData } from "./product-card.types";

const PRODUCT: ProductCardData = {
  handle: "iphone-17-pro",
  title: "iPhone 17 Pro 256 ГБ, синій титан",
  image: {
    url: "https://cdn.shopify.com/iphone.png",
    altText: "iPhone 17 Pro",
    width: 800,
    height: 800,
  },
  price: { amount: "64999", currencyCode: "UAH" },
  availableForSale: true,
  rating: { value: 4.9, count: 128 },
  delivery: "доставимо завтра",
};

vi.mock("~/components/ui/sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), warning: vi.fn(), error: vi.fn() }),
}));

beforeEach(() => {
  act(() => {
    wishlistStore.clear();
    compareStore.clear();
  });
  vi.clearAllMocks();
});

function renderCard(props: Partial<ProductCardProps> = {}) {
  return render(
    <MemoryRouter>
      <ProductCard product={PRODUCT} {...props} />
    </MemoryRouter>,
  );
}

const text = (element: HTMLElement) => (element.textContent ?? "").replace(/\s/g, " ");

describe("ProductCard", () => {
  it("показує назву-посилання, ціну, розстрочку та наявність", () => {
    renderCard();
    const card = screen.getByRole("article");

    expect(screen.getByRole("link", { name: PRODUCT.title })).toHaveAttribute(
      "href",
      "/products/iphone-17-pro",
    );
    expect(text(card)).toContain("64 999 ₴");
    expect(text(card)).toContain("2 600 ₴ × 25 міс.");
    expect(text(card)).toContain("В наявності, доставимо завтра");
  });

  it("фото має srcset із Shopify CDN і lazy-завантаження", () => {
    renderCard();
    const image = screen.getByRole("img", { name: "iPhone 17 Pro" });

    expect(image).toHaveAttribute("loading", "lazy");
    expect(image.getAttribute("srcset")).toContain("width=480 480w");
  });

  it("«Купити» викликає onAddToCart", async () => {
    const onAddToCart = vi.fn();
    renderCard({ onAddToCart });

    await userEvent.click(screen.getByRole("button", { name: /^Купити/ }));

    expect(onAddToCart).toHaveBeenCalledOnce();
  });

  it("зі знижкою показує бейдж −%, стару ціну та економію", () => {
    renderCard({
      product: {
        ...PRODUCT,
        price: { amount: "49999", currencyCode: "UAH" },
        compareAtPrice: { amount: "54499", currencyCode: "UAH" },
      },
    });
    const card = screen.getByRole("article");

    expect(text(card)).toContain("Знижка −8%");
    expect(text(card)).toContain("Стара ціна: 54 499 ₴");
    expect(text(card)).toContain("Економія 4 500 ₴");
  });

  it("показує бейдж із метаполя та стан уживаного пристрою", () => {
    renderCard({
      product: { ...PRODUCT, badge: "Новинка", used: { grade: "Відмінний", batteryHealth: 91 } },
    });
    const card = screen.getByRole("article");

    expect(within(card).getByText("Новинка")).toBeInTheDocument();
    expect(text(card)).toContain("Стан: Відмінний");
    expect(text(card)).toContain("Акумулятор 91%");
    expect(text(card)).toContain("Гарантія 6 міс.");
  });

  it("без наявності ховає «Купити», розстрочку та знижку", () => {
    renderCard({
      product: {
        ...PRODUCT,
        availableForSale: false,
        compareAtPrice: { amount: "70000", currencyCode: "UAH" },
      },
    });
    const card = screen.getByRole("article");

    expect(screen.queryByRole("button", { name: /^Купити/ })).toBeNull();
    expect(screen.getByRole("link", { name: `Докладніше: ${PRODUCT.title}` })).toBeInTheDocument();
    expect(text(card)).toContain("Немає в наявності");
    expect(text(card)).not.toContain("міс.");
    expect(text(card)).not.toContain("Знижка");
  });

  it("кнопки обраного та порівняння мають стан і підпис із назвою товару", async () => {
    const onToggleWishlist = vi.fn();
    renderCard({ wishlisted: true, onToggleWishlist });
    const wishlist = screen.getByRole("button", {
      name: `Прибрати з обраного: ${PRODUCT.title}`,
    });

    expect(wishlist).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: `Додати до порівняння: ${PRODUCT.title}` }),
    ).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(wishlist);
    expect(onToggleWishlist).toHaveBeenCalledOnce();
  });
});

describe("ProductCard: обране й порівняння без пропсів", () => {
  const wishlistButton = (state: "Додати в обране" | "Прибрати з обраного") =>
    screen.getByRole("button", { name: `${state}: ${PRODUCT.title}` });
  const compareButton = (state: "Додати до порівняння" | "Прибрати з порівняння") =>
    screen.getByRole("button", { name: `${state}: ${PRODUCT.title}` });

  it("сердечко зберігає товар в обраному й показує сповіщення", async () => {
    renderCard();

    await userEvent.click(wishlistButton("Додати в обране"));
    expect(wishlistButton("Прибрати з обраного")).toHaveAttribute("aria-pressed", "true");
    expect(wishlistStore.getSnapshot()).toEqual([PRODUCT.handle]);
    expect(toast.success).toHaveBeenCalledWith("Додано в обране", {
      action: expect.objectContaining({ label: "Відкрити обране" }),
    });

    await userEvent.click(wishlistButton("Прибрати з обраного"));
    expect(wishlistButton("Додати в обране")).toHaveAttribute("aria-pressed", "false");
    expect(wishlistStore.getSnapshot()).toEqual([]);
    expect(toast).toHaveBeenCalledWith("Прибрано з обраного");
  });

  it("терези додають товар до порівняння й прибирають його", async () => {
    renderCard();

    await userEvent.click(compareButton("Додати до порівняння"));
    expect(compareButton("Прибрати з порівняння")).toHaveAttribute("aria-pressed", "true");
    expect(compareStore.getSnapshot()).toEqual([PRODUCT.handle]);
    expect(toast.success).toHaveBeenCalledWith("Додано до порівняння", {
      action: expect.objectContaining({ label: "Відкрити порівняння" }),
    });

    await userEvent.click(compareButton("Прибрати з порівняння"));
    expect(compareStore.getSnapshot()).toEqual([]);
  });

  it("п'ятий товар до порівняння не додається, картка пояснює чому", async () => {
    act(() => {
      for (const handle of ["a", "b", "c", "d"]) compareStore.add(handle);
    });
    renderCard();

    await userEvent.click(compareButton("Додати до порівняння"));

    expect(compareButton("Додати до порівняння")).toHaveAttribute("aria-pressed", "false");
    expect(compareStore.getSnapshot()).toEqual(["a", "b", "c", "d"]);
    expect(toast.warning).toHaveBeenCalledWith(
      "У порівнянні вже 4 товари. Приберіть один, щоб додати новий.",
    );
  });

  it("картка відображає стан, збережений раніше, і зміни з інших карток", () => {
    act(() => {
      wishlistStore.add(PRODUCT.handle);
    });
    renderCard();
    expect(wishlistButton("Прибрати з обраного")).toBeInTheDocument();

    act(() => {
      wishlistStore.remove(PRODUCT.handle);
      compareStore.add(PRODUCT.handle);
    });
    expect(wishlistButton("Додати в обране")).toBeInTheDocument();
    expect(compareButton("Прибрати з порівняння")).toBeInTheDocument();
  });

  it("передані пропси мають перевагу над стором", async () => {
    act(() => {
      wishlistStore.add(PRODUCT.handle);
      compareStore.add(PRODUCT.handle);
    });
    const onToggleCompare = vi.fn();
    renderCard({ wishlisted: false, onToggleCompare });

    // wishlisted={false} без обробника: стан із пропса, стор не змінюється.
    await userEvent.click(wishlistButton("Додати в обране"));
    expect(wishlistStore.getSnapshot()).toEqual([PRODUCT.handle]);

    // Лише обробник: картка керована, стан за замовчуванням «не додано».
    await userEvent.click(compareButton("Додати до порівняння"));
    expect(onToggleCompare).toHaveBeenCalledOnce();
    expect(compareStore.getSnapshot()).toEqual([PRODUCT.handle]);
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe("ProductCardSkeleton", () => {
  it("озвучує завантаження", () => {
    render(<ProductCardSkeleton />);

    expect(screen.getByRole("status", { name: "Завантаження товару" })).toBeInTheDocument();
  });
});
