import { vi } from "vitest";

import { customerAccountContext } from "~/lib/customer-account";
import { storefrontClientContext } from "~/lib/storefront";

/** Лише для тестів маршрутів кабінету: контекст запиту з підставними клієнтами API. */

type Handler = (variables: unknown) => unknown;

export type AccountTestContextOptions = {
  /** `unavailable` — кабінет не налаштовано, `signed-out` — у сесії немає токена. */
  session?: "signed-in" | "signed-out" | "unavailable";
  /** Відповіді Customer Account API за документом запиту. */
  customer?: Map<unknown, Handler>;
  /** Відповідь Storefront API. */
  storefront?: Handler;
};

export function accountTestContext({
  session = "signed-in",
  customer = new Map(),
  storefront = () => ({ data: null }),
}: AccountTestContextOptions = {}) {
  const customerGraphql = vi.fn(async (document: unknown, options: { variables?: unknown }) => {
    const handler = customer.get(document);
    if (!handler) throw new Error("unexpected Customer Account document");
    return handler(options.variables);
  });
  const storefrontGraphql = vi.fn(async (_document: unknown, options: { variables?: unknown }) =>
    storefront(options.variables),
  );

  const customerAccount =
    session === "unavailable"
      ? null
      : {
          client: { graphql: customerGraphql },
          session: {
            getOrRefreshAccessToken: vi.fn(async () =>
              session === "signed-in" ? "token" : undefined,
            ),
          },
          sessionManager: {},
          requestContext: {},
        };

  const context = {
    get: (key: unknown) => {
      if (key === customerAccountContext) return customerAccount;
      if (key === storefrontClientContext) return { graphql: storefrontGraphql };
      throw new Error("unexpected context key");
    },
  };

  return { context, customerGraphql, storefrontGraphql };
}

/** Відповідь, яку loader або action викинув замість повернення (редирект, 404). */
export async function thrownResponse(run: () => Promise<unknown>): Promise<Response> {
  try {
    await run();
  } catch (error) {
    if (error instanceof Response) return error;
    throw error;
  }
  throw new Error("очікували викинуту відповідь");
}
