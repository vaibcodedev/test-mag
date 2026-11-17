import type { CustomerAccount } from "~/lib/customer-account";

/**
 * Спільні правила роботи з Customer Account API для сторінок кабінету.
 *
 *  - Текст помилки API англійський і технічний: покупець його не бачить, а в журнал сервера він
 *    потрапляє з префіксом `[customer-account]` (повідомлення й шлях поля) — інакше збій на
 *    живому магазині не знайти.
 *  - Схема, що йде з бібліотекою, новіша за живий API: поле може пройти перевірку `gql:check`
 *    і все одно повернути «Field doesn't exist». Тому другорядні дані запитуються окремо
 *    (`optionalAccountData`): їхній збій прибирає один блок, а не всю сторінку.
 */

export type AccountGraphqlError = {
  readonly message: string;
  readonly path?: ReadonlyArray<string | number>;
  readonly extensions?: Record<string, unknown>;
};

export type AccountGraphqlResult<Data> = {
  data: Data | null;
  errors?: readonly AccountGraphqlError[];
};

export type CustomerAccess = { client: CustomerAccount["client"]; accessToken: string };

/** Клієнт і дійсний токен покупця; `null` — кабінет не налаштовано або покупець не увійшов. */
export async function getCustomerAccess(
  customerAccount: CustomerAccount | null,
): Promise<CustomerAccess | null> {
  if (!customerAccount) return null;
  const { client, session, sessionManager, requestContext } = customerAccount;
  // Читання токена позначає відповідь як персональну, тож вона не кешується.
  const accessToken = await session.getOrRefreshAccessToken(sessionManager, requestContext);
  return accessToken ? { client, accessToken } : null;
}

function describeErrors(errors: readonly AccountGraphqlError[]): string {
  return errors.map((error) => `${error.message} (${error.path?.join(".") ?? "-"})`).join("; ");
}

/** Пише помилки GraphQL у журнал сервера. Повертає true, якщо вони були. */
export function logAccountErrors(
  label: string,
  errors: readonly AccountGraphqlError[] | null | undefined,
): boolean {
  if (!errors?.length) return false;
  console.error(`[customer-account] ${label}: ${describeErrors(errors)}`);
  return true;
}

/** Пише в журнал збій самого запиту: мережа, тайм-аут, відповідь не 2xx. */
export function logAccountFailure(label: string, error: unknown): void {
  const status = (error as { status?: unknown } | null)?.status;
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    `[customer-account] ${label}: ${message}${typeof status === "number" ? ` (HTTP ${status})` : ""}`,
  );
}

const DENIED_CODES = new Set(["ACCESS_DENIED", "FORBIDDEN", "UNAUTHORIZED"]);

/**
 * Чи відмовив API через права доступу: клієнту Customer Account API в каналі Headless
 * не дозволено цю дію (наприклад, немає `customer_write_customers`).
 */
export function isAccessDenied(failure: unknown): boolean {
  if (Array.isArray(failure)) {
    return (failure as AccountGraphqlError[]).some(
      (error) =>
        DENIED_CODES.has(String(error.extensions?.code ?? "")) ||
        /access denied|not authorized|unauthorized/i.test(error.message),
    );
  }
  const status = (failure as { status?: unknown } | null)?.status;
  return status === 401 || status === 403;
}

/**
 * Другорядні дані: і помилки GraphQL, і збій запиту лише пишуться в журнал.
 * Повертає `data` (можливо, часткові) або `null`, коли даних немає.
 */
export async function optionalAccountData<Data>(
  label: string,
  request: () => Promise<AccountGraphqlResult<Data>>,
): Promise<Data | null> {
  try {
    const { data, errors } = await request();
    logAccountErrors(label, errors);
    return data ?? null;
  } catch (error) {
    logAccountFailure(label, error);
    return null;
  }
}
