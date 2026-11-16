import { expect, test } from "@playwright/test";

/**
 * Обхід внутрішніх посилань: зі стартових сторінок збираємо всі <a href>, кожну унікальну
 * адресу запитуємо один раз і перевіряємо, що вона не відповідає 404 чи 5xx.
 *
 * E2E_ALLOW_MISSING — список префіксів через кому, яким дозволено відповідати 404.
 * На демо-каталозі mock.shop немає колекцій iphone, mac… і товарів із редакційних банерів,
 * тому для нього типове значення покриває ці адреси. На справжньому магазині задайте
 * E2E_ALLOW_MISSING="" — тоді кожне биті посилання провалить тест.
 */
const START_PAGES = [
  "/",
  "/collections",
  "/search?q=phone",
  "/cart",
  "/wishlist",
  "/compare",
  "/pages/delivery",
  "/pages/contacts",
  "/blogs/blog",
  "/account",
];

const MOCK_CATALOG_MISSING = [
  "/collections/iphone",
  "/collections/mac",
  "/collections/ipad",
  "/collections/watch",
  "/collections/airpods",
  "/collections/accessories",
  "/collections/used",
  "/collections/students",
  "/collections/deals",
  "/collections/new",
  "/collections/hits",
  "/products/iphone-",
  "/products/macbook-",
  "/products/ipad-",
  "/products/airpods-",
  "/products/apple-watch-",
];

const allowMissing = (process.env.E2E_ALLOW_MISSING ?? MOCK_CATALOG_MISSING.join(","))
  .split(",")
  .map((prefix) => prefix.trim())
  .filter(Boolean);

function isAllowedMissing(path: string): boolean {
  return allowMissing.some((prefix) => path.startsWith(prefix));
}

test("внутрішні посилання не ведуть на 404 чи помилку сервера", async ({ page, baseURL }) => {
  test.setTimeout(300_000);
  const origin = new URL(baseURL ?? "http://localhost").origin;
  const found = new Map<string, string>();

  for (const start of START_PAGES) {
    await page.goto(start);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 60_000 });

    const hrefs = await page
      .locator("a[href]")
      .evaluateAll((anchors) => anchors.map((anchor) => (anchor as HTMLAnchorElement).href));

    for (const href of hrefs) {
      const url = new URL(href);
      if (url.origin !== origin) continue;
      // Якір на тій самій сторінці та оформлення замовлення (веде в Shopify) не перевіряємо.
      if (url.pathname.startsWith("/checkout")) continue;
      const path = url.pathname + url.search;
      if (!found.has(path)) found.set(path, start);
    }
  }

  expect(found.size).toBeGreaterThan(20);

  const broken: string[] = [];
  const expectedMissing: string[] = [];

  for (const [path, source] of found) {
    const response = await page.request.get(path, { maxRedirects: 5 });
    const status = response.status();
    if (status < 400) continue;
    if (status === 404 && isAllowedMissing(path)) {
      expectedMissing.push(path);
      continue;
    }
    broken.push(`${status} ${path} (посилання на сторінці ${source})`);
  }

  test.info().annotations.push({
    type: "links",
    description: `перевірено ${found.size}, очікувано відсутні на демо-каталозі: ${expectedMissing.length}`,
  });

  expect(broken).toEqual([]);
});

test("якорі #about і #reviews ведуть до наявних секцій головної", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 60_000 });

  for (const id of ["about", "reviews"]) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
});
