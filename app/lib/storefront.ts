import {
  type CacheInstance,
  type CachingStrategy,
  createShopifyRequestContext,
  createStorefrontClient,
  type PublicStorefrontClient,
  type RequestScopedPrivateStorefrontClient,
  type StorefrontClient,
} from "@shopify/hydrogen";
import { createContext } from "react-router";

import type { Env } from "~/lib/env";
import {
  getBuyerIp,
  getMockShopDomain,
  getPrivateStorefrontToken,
  getStoreDomain,
  i18n,
  shouldUseMockShop,
} from "~/lib/shop";

// Real store: private token + trusted buyer IP. mock.shop: tokenless public
// access (it is auth-free and rejects any private token, even a placeholder).
//
// Both branches pass `cache` to `createStorefrontClient`, so `graphql()` accepts a per-query
// `cache` strategy: that is the `Extra` type parameter below. Caching engages only for queries
// that pass `cache`; cart and customer reads never do.
export type StorefrontCacheOptions = { cache?: CachingStrategy };

export type RequestStorefrontClient =
  | RequestScopedPrivateStorefrontClient<StorefrontCacheOptions>
  | PublicStorefrontClient<StorefrontCacheOptions>;

/** What data loaders need from the client: `graphql()` with the optional `cache` strategy. */
export type StorefrontGraphqlClient = Pick<StorefrontClient<StorefrontCacheOptions>, "graphql">;

export function createRequestStorefrontClient(
  request: Request,
  env: Env,
  cache: CacheInstance,
  waitUntil: ExecutionContext["waitUntil"],
): RequestStorefrontClient {
  if (shouldUseMockShop(env)) {
    return createStorefrontClient({
      type: "public",
      requestContext: createShopifyRequestContext({ request, i18n }),
      config: {
        storeDomain: getMockShopDomain(env),
        cache,
        waitUntil,
      },
    });
  }

  return createStorefrontClient({
    type: "private",
    requestContext: createShopifyRequestContext({
      request,
      i18n,
      buyerIp: getBuyerIp(request.headers),
    }),
    config: {
      storeDomain: getStoreDomain(env),
      privateStorefrontToken: getPrivateStorefrontToken(env),
      storefrontId: env.PUBLIC_STOREFRONT_ID,
      cache,
      waitUntil,
    },
  });
}

export const storefrontClientContext = createContext<RequestStorefrontClient>();
