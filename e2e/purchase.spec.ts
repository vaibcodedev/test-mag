import { expect, test } from "@playwright/test";

/**
 * Головний шлях покупця: знайти товар → відкрити його → додати в кошик → перейти до оформлення.
 * Запит і очікування не прив'язані до конкретних товарів, тож тест працює і на mock.shop,
 * і на справжньому магазині (E2E_QUERY задає пошуковий запит).
 */
const QUERY = process.env.E2E_QUERY ?? "phone";

test("знайти товар, додати в кошик і перейти до оформлення", async ({ page }) => {
  await page.goto("/");
  // Перший запит до холодного dev-сервера компілює сторінку, тому чекаємо довше.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 60_000 });

  // 1. Пошук із шапки: підказки з'являються під полем, Enter веде на сторінку результатів.
  const search = page.getByRole("banner").getByRole("combobox");
  await search.click();
  await search.pressSequentially(QUERY, { delay: 40 });
  await expect(page.getByRole("listbox").getByRole("option").first()).toBeVisible();
  await search.press("Enter");

  await expect(page).toHaveURL(/\/search\?q=/);
  const cards = page.locator('[data-slot="product-card"]');
  await expect(cards.first()).toBeVisible();

  // 2. Сторінка товару.
  const firstTitle = cards.first().getByRole("link").first();
  const productTitle = (await firstTitle.textContent())?.trim() ?? "";
  await firstTitle.click();
  await expect(page).toHaveURL(/\/products\//);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(productTitle);

  // 3. «Купити»: сповіщення й кошик, що відкрився сам.
  await page
    .getByRole("main")
    .getByRole("button", { name: /^Купити/ })
    .first()
    .click();

  const cart = page.getByRole("dialog", { name: "Кошик" });
  await expect(cart).toBeVisible();
  await expect(cart.getByText(productTitle).first()).toBeVisible();
  await expect(page.getByText("Додано в кошик")).toBeVisible();

  // 4. Кількість змінюється без перезавантаження сторінки.
  await cart.getByRole("button", { name: "Збільшити кількість" }).first().click();
  await expect(cart.locator('input[name="quantity"]').first()).toHaveValue("2");

  // 5. Оформлення: посилання веде на checkout магазину.
  const checkout = cart.getByRole("link", { name: /Оформити замовлення/ });
  await expect(checkout).toHaveAttribute("href", /checkout|cart\/c\//);
  await checkout.click();
  await page.waitForURL((url) => !url.pathname.startsWith("/products/"));
  expect(page.url()).toMatch(/checkout|cart\/c\//);
});

test("кошик відображається з сервера і без товарів пропонує каталог", async ({ page }) => {
  await page.goto("/cart");

  await expect(page.getByRole("heading", { level: 1, name: "Кошик" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Перейти до каталогу" })).toBeVisible();
});

test("невідома адреса показує сторінку 404 з дорогою назад", async ({ page }) => {
  const response = await page.goto("/products/no-such-product");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Сторінку не знайдено" })).toBeVisible();
});
