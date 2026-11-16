import { describe, expect, it } from "vitest";

import { shouldRevalidateRoot } from "./root-revalidation";

type Args = Parameters<typeof shouldRevalidateRoot>[0];

function args(current: string, next: string, overrides: Partial<Args> = {}): Args {
  return {
    currentUrl: new URL(current, "https://sad.example"),
    nextUrl: new URL(next, "https://sad.example"),
    // У режимі single fetch React Router типово перезапускає loader-и на кожній навігації.
    defaultShouldRevalidate: true,
    ...overrides,
  };
}

describe("shouldRevalidateRoot", () => {
  it.each([
    ["фільтр каталогу", "/collections/iphone", "/collections/iphone?filter.v.availability=1"],
    [
      "сортування",
      "/collections/iphone?sort_by=price-ascending",
      "/collections/iphone?sort_by=price-descending",
    ],
    ["пагінація", "/collections/iphone", "/collections/iphone?after=abc"],
    ["скидання фільтрів", "/collections/iphone?after=abc", "/collections/iphone"],
    ["варіант товару", "/products/iphone-17?Колір=Синій", "/products/iphone-17?Колір=Чорний"],
    ["новий пошуковий запит", "/search?q=iphone", "/search?q=mac"],
  ])("не перезапускає кореневий loader: %s", (_name, current, next) => {
    expect(shouldRevalidateRoot(args(current, next))).toBe(false);
  });

  it("перезапускає під час переходу на іншу сторінку", () => {
    expect(shouldRevalidateRoot(args("/", "/collections/iphone"))).toBe(true);
    expect(shouldRevalidateRoot(args("/collections/iphone?after=abc", "/products/iphone-17"))).toBe(
      true,
    );
  });

  it("перезапускає після явного revalidate() і повторного переходу на ту саму адресу", () => {
    expect(
      shouldRevalidateRoot(args("/collections/iphone?after=abc", "/collections/iphone?after=abc")),
    ).toBe(true);
  });

  it("перезапускає після відправки форми не методом GET, навіть якщо змінився лише рядок запиту", () => {
    for (const formMethod of ["POST", "post", "PUT", "DELETE"] as Args["formMethod"][]) {
      expect(shouldRevalidateRoot(args("/cart", "/cart?added=1", { formMethod }))).toBe(true);
      // Невдалий action: React Router за замовчуванням не перезапускав би, але кошик міг змінитись.
      expect(
        shouldRevalidateRoot(
          args("/cart", "/cart", { formMethod, defaultShouldRevalidate: false }),
        ),
      ).toBe(true);
    }
  });

  it("GET-форма (пошук, фільтри без JavaScript-обробника) поводиться як звичайна навігація", () => {
    expect(shouldRevalidateRoot(args("/search?q=a", "/search?q=b", { formMethod: "GET" }))).toBe(
      false,
    );
    expect(shouldRevalidateRoot(args("/", "/search?q=b", { formMethod: "GET" }))).toBe(true);
  });

  it("в інших випадках не сперечається з React Router", () => {
    expect(
      shouldRevalidateRoot(args("/", "/collections", { defaultShouldRevalidate: false })),
    ).toBe(false);
  });
});
