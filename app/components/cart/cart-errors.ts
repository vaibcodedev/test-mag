/**
 * Тексти помилок кошика українською.
 * Shopify повертає повідомлення мовою магазину або англійською, тому показуємо власний текст
 * за кодом помилки, а для невідомих кодів — загальну пораду, що робити далі.
 */

export type CartErrorLike = { code?: string | null; message: string };
export type CartErrorGroupLike = {
  userErrors: readonly CartErrorLike[];
  warnings: readonly CartErrorLike[];
};
export type CartErrorsLike = {
  cart: CartErrorGroupLike;
  lines: ReadonlyMap<string, CartErrorGroupLike>;
  network: readonly { message: string; status?: number }[];
};

export const LINE_ERROR_FALLBACK =
  "Не вдалося змінити цей товар. Спробуйте ще раз або оновіть сторінку.";
export const CART_ERROR_FALLBACK = "Не вдалося оновити кошик. Спробуйте ще раз за хвилину.";
export const NETWORK_ERROR =
  "Немає зв'язку з магазином. Перевірте інтернет і повторіть дію — кошик не змінився.";
const REMOVED_LINE_ERROR = "Не вдалося змінити товар, якого вже немає в кошику. Оновіть сторінку.";

const MESSAGES: Record<string, string> = {
  MERCHANDISE_NOT_ENOUGH_STOCK: "Стільки одиниць немає в наявності. Зменште кількість.",
  MERCHANDISE_OUT_OF_STOCK: "Товар закінчився. Приберіть його з кошика, щоб оформити замовлення.",
  PRODUCT_UNAVAILABLE_IN_BUYER_LOCATION:
    "Цей товар не доставляємо у ваш регіон. Приберіть його з кошика.",
  MAXIMUM_EXCEEDED: "Це більше, ніж можна замовити за один раз. Зменште кількість.",
  MINIMUM_NOT_MET: "Це менше за мінімальну кількість для замовлення. Збільште кількість.",
  INVALID_INCREMENT: "Цей товар продається лише набором. Змініть кількість на кратну набору.",
  LESS_THAN: "Кількість має бути меншою. Зменште її й спробуйте ще раз.",
  INVALID_MERCHANDISE_LINE: "Цього товару вже немає в кошику. Оновіть сторінку.",
  MERCHANDISE_NOT_APPLICABLE: "Цей товар зараз не можна купити. Приберіть його з кошика.",
  CART_TOO_LARGE: "У кошику забагато товарів. Приберіть частину й спробуйте ще раз.",
  SERVICE_UNAVAILABLE: "Магазин тимчасово не відповідає. Спробуйте ще раз за хвилину.",
};

/** Текст однієї помилки: за кодом, інакше запасний. */
export function cartErrorMessage(error: CartErrorLike, fallback = CART_ERROR_FALLBACK): string {
  return (error.code && MESSAGES[error.code]) || fallback;
}

/** Повідомлення біля рядка кошика; null, якщо помилок немає. */
export function lineErrorMessage(group: CartErrorGroupLike | undefined): string | null {
  const error = group?.userErrors[0] ?? group?.warnings[0];
  return error ? cartErrorMessage(error, LINE_ERROR_FALLBACK) : null;
}

/**
 * Повідомлення для банера над кошиком: помилки мережі, усього кошика та рядків, яких у кошику
 * вже немає. Помилки наявних рядків показуються біля самих рядків.
 */
export function bannerErrorMessages(
  errors: CartErrorsLike,
  lineIds: ReadonlySet<string>,
): string[] {
  const messages: string[] = [];

  if (errors.network.length > 0) messages.push(NETWORK_ERROR);
  for (const error of errors.cart.userErrors) messages.push(cartErrorMessage(error));
  for (const error of errors.cart.warnings) messages.push(cartErrorMessage(error));
  for (const [lineId, group] of errors.lines) {
    if (lineIds.has(lineId)) continue;
    if (group.userErrors.length + group.warnings.length > 0) messages.push(REMOVED_LINE_ERROR);
  }

  return [...new Set(messages)];
}
