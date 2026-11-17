/**
 * Адреса замовлення в кабінеті.
 *
 * Shopify називає замовлення `gid://shopify/Order/1234567890`. У шлях сторінки такий рядок
 * не кладемо (двокрапки й скісні риски довелося б кодувати, і частина проксі їх псує),
 * тож в адресі лишається тільки число: `/account/orders/1234567890`. Чуже чи вигадане число
 * нічого не відкриє: API віддає замовлення лише його покупцеві.
 */

const ORDER_GID = /^gid:\/\/shopify\/Order\/(\d{1,20})$/;
const ORDER_PARAM = /^\d{1,20}$/;

/** `gid://shopify/Order/42` → `42`. Ідентифікатор іншого вигляду → `null`: посилання не будуємо. */
export function orderIdToParam(id: string | null | undefined): string | null {
  return id?.match(ORDER_GID)?.[1] ?? null;
}

/** `42` → `gid://shopify/Order/42`. Усе, що не є числом, → `null` (маршрут відповідає 404). */
export function orderParamToId(param: string | null | undefined): string | null {
  return param && ORDER_PARAM.test(param) ? `gid://shopify/Order/${param}` : null;
}

/** Сторінка замовлення в кабінеті або `null`, якщо ідентифікатор не вдалося розібрати. */
export function orderPath(id: string | null | undefined): string | null {
  const param = orderIdToParam(id);
  return param ? `/account/orders/${param}` : null;
}

/** Адреса, яка повертає план повторення замовлення (JSON). */
export function orderReorderPath(id: string | null | undefined): string | null {
  const path = orderPath(id);
  return path ? `${path}/reorder` : null;
}
