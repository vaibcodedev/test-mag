/**
 * Помилки GraphQL зі Storefront API.
 *
 * `storefrontClient.graphql()` не кидає виняток на помилки GraphQL: повертає `{ data, errors }`.
 * Тут одне правило для всіх завантажувачів:
 *  - є `errors` і потрібних даних немає → відповідь 502 (це збій, а не «не знайдено»);
 *  - `data.<сутність> === null` без помилок → сутності справді немає, маршрут відповідає 404;
 *  - є і дані, і `errors` (не відповіла другорядна частина) → пишемо в журнал і працюємо далі.
 *
 * Текст помилки магазину потрапляє лише в журнал сервера, відвідувач його не бачить.
 */

type GraphqlError = { readonly message: string; readonly path?: ReadonlyArray<string | number> };

export type GraphqlResult<Data> = {
  data: Data | null | undefined;
  errors?: readonly GraphqlError[] | null;
};

const UPSTREAM_MESSAGE = "Магазин тимчасово не відповідає. Спробуйте оновити сторінку за хвилину.";

export function hasGraphqlErrors(result: Pick<GraphqlResult<unknown>, "errors">): boolean {
  return Array.isArray(result.errors) && result.errors.length > 0;
}

/** Пише помилки GraphQL у журнал сервера. Повертає true, якщо вони були. */
export function logGraphqlErrors(
  label: string,
  result: Pick<GraphqlResult<unknown>, "errors">,
): boolean {
  if (!hasGraphqlErrors(result)) return false;
  const details = (result.errors ?? [])
    .map((error) =>
      error.path?.length ? `${error.message} (${error.path.join(".")})` : error.message,
    )
    .join("; ");
  console.error(`[storefront] ${label}: ${details}`);
  return true;
}

/** Відповідь 5xx без подробиць магазину. Деталі мають бути вже в журналі. */
export function upstreamErrorResponse(status: 502 | 503 = 502): Response {
  return new Response(UPSTREAM_MESSAGE, {
    status,
    statusText: "Storefront API error",
    headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * Дані запиту, без яких сторінку не зібрати. Немає `data` → 502.
 * Часткові дані з помилками повертаються як є: помилки вже в журналі.
 */
export function requireData<Data>(label: string, result: GraphqlResult<Data>): Data {
  logGraphqlErrors(label, result);
  if (result.data === null || result.data === undefined) {
    if (!hasGraphqlErrors(result)) console.error(`[storefront] ${label}: відповідь без даних`);
    throw upstreamErrorResponse();
  }
  return result.data;
}

/**
 * Сутність із відповіді (товар, колекція, сторінка, блог).
 *  - сутність є → повертається (помилки другорядних полів лише в журналі);
 *  - сутності немає, помилок немає → `null`: її справді не існує, маршрут відповідає 404;
 *  - сутності немає і є помилки → 502.
 */
export function requireEntity<Data, Entity>(
  label: string,
  result: GraphqlResult<Data>,
  pick: (data: Data) => Entity | null | undefined,
): Entity | null {
  const failed = logGraphqlErrors(label, result);
  const entity =
    result.data === null || result.data === undefined ? null : (pick(result.data) ?? null);
  if (entity !== null) return entity;
  if (failed) throw upstreamErrorResponse();
  if (result.data === null || result.data === undefined) {
    console.error(`[storefront] ${label}: відповідь без даних`);
    throw upstreamErrorResponse();
  }
  return null;
}

/**
 * Другорядні дані (рекомендації, лічильник, фото для меню): помилка не має ламати сторінку.
 * Повертає `data` або `null`; і помилки GraphQL, і збій мережі лише пишуться в журнал.
 */
export async function optionalData<Data>(
  label: string,
  request: () => Promise<GraphqlResult<Data>>,
): Promise<Data | null> {
  try {
    const result = await request();
    logGraphqlErrors(label, result);
    return result.data ?? null;
  } catch (error) {
    console.error(`[storefront] ${label}: запит не вдався`, error);
    return null;
  }
}

/** Адреса тієї самої сторінки без курсорів пагінації, або `null`, якщо курсорів у ній немає. */
export function withoutCursor(requestUrl: string | URL): string | null {
  const url = new URL(requestUrl);
  if (!url.searchParams.has("after") && !url.searchParams.has("before")) return null;
  url.searchParams.delete("after");
  url.searchParams.delete("before");
  return `${url.pathname}${url.search}`;
}

/**
 * Зіпсований або застарілий курсор (`?after=…`) Storefront API повертає як помилку.
 * Це не «сторінки немає» і не збій магазину: відправляємо на першу сторінку списку.
 * Без курсора в адресі нічого не робить — тоді помилку обробляє звичайне правило.
 */
export function redirectToFirstPageOnError(
  label: string,
  result: Pick<GraphqlResult<unknown>, "errors">,
  requestUrl: string | URL,
): void {
  if (!hasGraphqlErrors(result)) return;
  const firstPage = withoutCursor(requestUrl);
  if (!firstPage) return;
  logGraphqlErrors(`${label} (курсор відкинуто, перехід на першу сторінку)`, result);
  throw new Response(null, {
    status: 302,
    headers: { Location: firstPage, "Cache-Control": "no-store" },
  });
}
