import { createContentSecurityPolicy } from "@shopify/hydrogen";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import { ServerRouter, type EntryContext, type RouterContextProvider } from "react-router";

import { NonceProvider } from "~/lib/csp";
import { envContext } from "~/lib/env";
import { getMockShopDomain, getStoreDomain, shouldUseMockShop } from "~/lib/shop";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: RouterContextProvider,
) {
  const env = context.get(envContext);

  const storeDomain = shouldUseMockShop(env) ? getMockShopDomain(env) : getStoreDomain(env);
  const csp = createContentSecurityPolicy({
    shop: { storeDomain, checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN },
    directives: {
      // Відео товару з YouTube і Vimeo в галереї (<iframe> з'являється після натискання
      // «Відтворити»). Адреси плеєрів будує externalVideoEmbedUrl у lib/shopify/product.ts.
      frameSrc: ["https://www.youtube-nocookie.com", "https://player.vimeo.com"],
      // Файли відео товару Shopify віддає не лише з cdn.shopify.com, а й із домену магазину
      // (/cdn/shop/videos/…): без нього браузер блокує відео й плеєр показує помилку.
      mediaSrc: ["'self'", "https://cdn.shopify.com", `https://${storeDomain}`],
    },
  });

  const body = await renderToReadableStream(
    <NonceProvider value={csp.nonce}>
      <ServerRouter context={reactRouterContext} url={request.url} nonce={csp.nonce} />
    </NonceProvider>,
    {
      nonce: csp.nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  if (isbot(request.headers.get("user-agent"))) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  csp.applyResponseHeaders(responseHeaders);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
