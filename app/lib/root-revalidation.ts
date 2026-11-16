import type { ShouldRevalidateFunctionArgs } from "react-router";

/**
 * Коли кореневий loader (кошик, дані магазину, каталог для шапки) запускається знову.
 *
 * React Router у режимі single fetch типово перезапускає всі loader-и на кожній навігації.
 * Для кореня це зайве, коли змінився лише рядок запиту тієї самої сторінки: фільтри,
 * сортування й пагінація каталогу, вибір варіанта товару, сторінки пошуку. Шапка, футер
 * і кошик від цих параметрів не залежать, а кошик у браузері веде стор Hydrogen
 * (CartProvider бере initialData лише під час першого рендеру, далі стор оновлює себе сам
 * через Standard Actions).
 *
 * Перезапуск лишається:
 *  - після будь-якої відправки форми не методом GET (action міг змінити кошик чи сесію);
 *  - після явного revalidate() і повторного переходу на ту саму адресу;
 *  - під час переходу на іншу сторінку (інший pathname) — як і було в шаблоні.
 */
export function shouldRevalidateRoot({
  formMethod,
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}: Pick<
  ShouldRevalidateFunctionArgs,
  "formMethod" | "currentUrl" | "nextUrl" | "defaultShouldRevalidate"
>): boolean {
  if (formMethod && formMethod.toUpperCase() !== "GET") return true;
  if (currentUrl.pathname === nextUrl.pathname && currentUrl.search !== nextUrl.search) {
    return false;
  }
  return defaultShouldRevalidate;
}
