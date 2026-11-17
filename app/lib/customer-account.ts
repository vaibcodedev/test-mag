import { createCartServerHandlers, type ShopifyRequestContext } from "@shopify/hydrogen";
import {
  createCustomerAccountClient,
  createCustomerAccountServerHandlers,
  createCustomerSession,
  type CustomerAccountClient,
  type CustomerSession,
  type WritableCustomerSessionManager,
} from "@shopify/hydrogen/customer-account";
import { createContext } from "react-router";

import type { Env } from "~/lib/env";
import { createRequestSessionManager } from "~/lib/session";
import { shouldUseMockShop } from "~/lib/shop";

export type CustomerAccount = {
  client: CustomerAccountClient;
  session: CustomerSession;
  /** Обробники кошика з прив'язкою до покупця: їм потрібні sessionManager і requestContext. */
  cartHandlers: CustomerCartHandlers;
  sessionManager: WritableCustomerSessionManager;
  requestContext: ShopifyRequestContext;
};

// `null` when Customer Accounts are unavailable (see `createRequestCustomerAccount`).
export const customerAccountContext = createContext<CustomerAccount | null>(null);

/**
 * Обробники кошика, прив'язані до сесії покупця. За документацією Hydrogen («Cart Buyer
 * Identity Sync») кошик і кабінет мають ділити одну `customerSession`: тоді новий кошик
 * створюється вже з покупцем, вхід прив'язує покупця до наявного кошика, вихід — відв'язує,
 * а посилання на оформлення для того, хто увійшов, отримує `logged_in=true`.
 */
function createCustomerCartHandlers(customerSession: ReturnType<typeof createCustomerSession>) {
  return createCartServerHandlers({ customerSession });
}
export type CustomerCartHandlers = ReturnType<typeof createCustomerCartHandlers>;

// Reused across requests so concurrent token refreshes for the same customer
// share one request to Shopify.
let cached:
  | {
      key: string;
      session: ReturnType<typeof createCustomerSession>;
      cartHandlers: CustomerCartHandlers;
      handlers: ReturnType<typeof createCustomerAccountServerHandlers>;
    }
  | undefined;

/**
 * Customer Accounts need a real store, `SHOP_ID`, `PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID`,
 * `SESSION_SECRET`, and HTTPS (the OAuth callback must be an HTTPS origin).
 */
export async function createRequestCustomerAccount(
  request: Request,
  env: Env,
  requestContext: ShopifyRequestContext,
) {
  const {
    SHOP_ID: shopId,
    PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID: customerAccountApiClientId,
    SESSION_SECRET: sessionSecret,
  } = env;
  if (shouldUseMockShop(env) || !shopId || !customerAccountApiClientId || !sessionSecret) return;
  if (new URL(request.url).protocol !== "https:") return;

  const key = `${shopId}:${customerAccountApiClientId}`;
  if (cached?.key !== key) {
    const session = createCustomerSession({ shopId, customerAccountApiClientId });
    const cartHandlers = createCustomerCartHandlers(session);
    const handlers = createCustomerAccountServerHandlers({
      customerSession: session,
      // Кошик у браузері йде в ногу із сесією покупця: вхід прив'язує, вихід відв'язує.
      cartServerHandlers: cartHandlers,
      defaultPostLoginRedirectPathname: "/account",
    });
    cached = { key, session, cartHandlers, handlers };
  }

  return {
    handlers: cached.handlers,
    cartHandlers: cached.cartHandlers,
    customerAccount: {
      client: createCustomerAccountClient({ shopId, requestContext }),
      session: cached.session,
      cartHandlers: cached.cartHandlers,
      sessionManager: await createRequestSessionManager(request, sessionSecret),
      requestContext,
    } satisfies CustomerAccount,
  };
}

/**
 * Чи увійшов покупець. Потрібно шапці, щоб показати це значком.
 * `isLoggedIn()` за документацією Hydrogen — перевірка лише для інтерфейсу: вона тільки читає
 * сесію (є придатний токен доступу або токен оновлення) і нічого не оновлює й не записує.
 * Якщо кабінет недоступний або сесію не вдалося прочитати, вважаємо покупця гостем.
 */
export async function isSignedIn(customerAccount: CustomerAccount | null): Promise<boolean> {
  if (!customerAccount) return false;
  try {
    const { session, sessionManager, requestContext } = customerAccount;
    return await session.isLoggedIn(sessionManager, requestContext);
  } catch {
    return false;
  }
}
