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

  const csp = createContentSecurityPolicy({
    shop: {
      storeDomain: shouldUseMockShop(env) ? getMockShopDomain(env) : getStoreDomain(env),
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
    },
    directives: {
      // Відео товару з YouTube і Vimeo в галереї (<iframe> з'являється після натискання
      // «Відтворити»). Адреси плеєрів будує externalVideoEmbedUrl у lib/shopify/product.ts.
      // Відео й обкладинки з Shopify вже дозволені типовими media-src та img-src (cdn.shopify.com).
      frameSrc: ["https://www.youtube-nocookie.com", "https://player.vimeo.com"],
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
