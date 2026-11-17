import { handleShopifyRedirects, handleShopifyRoutes } from "@shopify/hydrogen";
import { ShopifyScripts } from "@shopify/hydrogen/react";
import { TriangleAlert } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
  useRouteLoaderData,
  UNSAFE_useScrollRestoration as useScrollRestoration,
  type ShouldRevalidateFunctionArgs,
} from "react-router";

import { CartAnalyticsTracker, PageViewedTracker } from "~/components/analytics/analytics-trackers";
import { CartDrawer } from "~/components/cart/cart-drawer";
import { BottomBar } from "~/components/layout/bottom-bar";
import { Container } from "~/components/layout/container";
import { Footer } from "~/components/layout/footer";
import { Header } from "~/components/layout/header";
import { NotFound } from "~/components/layout/not-found";
import { TopBar } from "~/components/layout/top-bar";
import { Button } from "~/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { registerAppNavigate } from "~/lib/app-navigate";
import { CartProvider } from "~/lib/cart";
import { cartHandlers } from "~/lib/cart-handlers";
import { useNonce } from "~/lib/csp";
import { createRequestCustomerAccount, customerAccountContext } from "~/lib/customer-account";
import { envContext } from "~/lib/env";
import { predictiveSearchHandlers } from "~/lib/predictive-search-handlers";
import { loadRootLayout } from "~/lib/root-layout";
import { shouldRevalidateRoot } from "~/lib/root-revalidation";
import { routeTemplates } from "~/lib/route-templates";
import { createEphemeralSessionManager } from "~/lib/session";
import { loadCatalog } from "~/lib/shopify/catalog";
import { analyticsConsent, resolveShopIdentity } from "~/lib/shop";
import { createRequestStorefrontClient, storefrontClientContext } from "~/lib/storefront";

import type { Route } from "./+types/root";

import onestCyrillicHref from "@fontsource-variable/onest/files/onest-cyrillic-wght-normal.woff2?url";
import unboundedCyrillicHref from "@fontsource-variable/unbounded/files/unbounded-cyrillic-wght-normal.woff2?url";

import appStylesHref from "./styles/app.css?url";

// Інтерфейс український, тому заздалегідь вантажимо кириличні файли обох гарнітур.
const PRELOADED_FONTS = [onestCyrillicHref, unboundedCyrillicHref];

export const links: Route.LinksFunction = () => [
  ...PRELOADED_FONTS.map((href) => ({
    rel: "preload",
    href,
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous" as const,
  })),
  { rel: "stylesheet", href: appStylesHref },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
];

export const middleware: Route.MiddlewareFunction[] = [
  async ({ context, request }, next) => {
    const env = context.get(envContext);
    const storefrontClient = createRequestStorefrontClient(
      request,
      env,
      context.cache,
      context.waitUntil,
    );
    const requestContext = storefrontClient.requestContext;
    const customerAccount = await createRequestCustomerAccount(request, env, requestContext);
    const sessionManager =
      customerAccount?.customerAccount.sessionManager ?? createEphemeralSessionManager(request);

    const shopifyRoute = handleShopifyRoutes({
      request,
      requestContext,
      sessionManager,
      storefrontClient,
      routeTemplates,
      handlers: customerAccount
        ? [cartHandlers, predictiveSearchHandlers, customerAccount.handlers]
        : [cartHandlers, predictiveSearchHandlers],
    });

    if (shopifyRoute) return shopifyRoute;

    context.set(storefrontClientContext, storefrontClient);
    context.set(customerAccountContext, customerAccount?.customerAccount ?? null);

    const response = await next();
    const sessionHeaders = new Headers((await sessionManager.commit?.()) ?? undefined);
    for (const [name, value] of sessionHeaders) response.headers.append(name, value);
    if (response.status === 404) {
      const redirect = await handleShopifyRedirects({
        request,
        storefrontClient,
        routeTemplates,
      });

      if (redirect) return redirect;
    }

    requestContext.applyResponseHeaders(response.headers);
    return response;
  },
];

export async function loader({ context, request }: Route.LoaderArgs) {
  const env = context.get(envContext);
  const storefrontClient = context.get(storefrontClientContext);
  const [cartResult, layout, catalog] = await Promise.all([
    cartHandlers.get({ storefrontClient, request }),
    loadRootLayout(storefrontClient),
    loadCatalog(storefrontClient),
  ]);

  return {
    cartData: cartResult.data,
    shopInfo: layout.shopInfo,
    catalog,
    shopIdentity: resolveShopIdentity(env, layout.shopId),
    currency: layout.currency,
    locale: storefrontClient.locale,
  };
}

// Кореневий loader не перезапускається, коли змінився лише рядок запиту тієї самої сторінки
// (фільтри, сортування, пагінація, варіант товару). Правило й пояснення — у ~/lib/root-revalidation.
export function shouldRevalidate(args: ShouldRevalidateFunctionArgs) {
  return shouldRevalidateRoot(args);
}

/**
 * Документ уже був у браузері. React Router малює <Layout> окремо довкола сторінки й довкола
 * ErrorBoundary, тому коли loader викидає 404 під час переходу без перезавантаження (і коли
 * з такої сторінки йдуть далі), увесь <html> монтується наново — вже в браузері. Скрипти, які
 * мають сенс лише в HTML із сервера (ShopifyScripts, скрипт відновлення прокрутки), React тоді
 * створив би як елементи, що ніколи не виконаються, і попередив би в консолі: «Encountered a
 * script tag while rendering React component». Вони вже відпрацювали під час першого
 * завантаження, тож на повторному монтуванні їх не рендеримо.
 * JSON-LD це не стосується: <script type="application/ld+json"> — блок даних, React його
 * дозволяє й на клієнті.
 */
let documentMounted = false;

/** Відновлення прокрутки без серверного скрипта: лише логіка ScrollRestoration. */
function ClientScrollRestoration() {
  useScrollRestoration();
  return null;
}

export function Layout({ children }: { children: ReactNode }) {
  const nonce = useNonce();
  const navigate = useNavigate();
  // Absent when the root loader failed (error page only).
  const rootData = useRouteLoaderData<typeof loader>("root");
  // Значення фіксується на першому рендері цього екземпляра: гідратація бачить те саме, що сервер.
  const [remounted] = useState(() => documentMounted);
  useEffect(() => {
    documentMounted = true;
  }, []);

  return (
    <html lang="uk">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {rootData && !remounted ? (
          <ShopifyScripts
            nonce={nonce}
            i18n={{ ...rootData.locale, currency: rootData.currency }}
            shop={rootData.shopIdentity.scriptShop}
            analytics={{ channel: rootData.shopIdentity.analyticsShop.channel }}
            shopifyAnalytics={rootData.shopIdentity.shopifyAnalytics}
            consent={analyticsConsent}
            navigate={navigate}
            routes={routeTemplates}
          />
        ) : null}
        <Meta />
        <Links />
      </head>
      <body className="flex min-h-svh flex-col bg-background font-sans text-foreground antialiased">
        <a
          href="#main-content"
          className="focus-visible:bg-interactive focus-visible:text-interactive-text sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:start-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded focus-visible:px-4 focus-visible:py-2"
        >
          Перейти до вмісту
        </a>
        {children}
        {remounted ? <ClientScrollRestoration /> : <ScrollRestoration nonce={nonce} />}
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  // Дії в тостах («Відкрити порівняння») переходять через роутер, без перезавантаження.
  const navigate = useNavigate();
  useEffect(() => registerAppNavigate((to) => navigate(to, { viewTransition: true })), [navigate]);

  return (
    <CartProvider initialData={loaderData.cartData}>
      <TooltipProvider>
        <PageViewedTracker />
        <CartAnalyticsTracker />
        <TopBar />
        <Header categories={loaderData.catalog} />
        <Outlet />
        <Footer />
        <BottomBar />
        <CartDrawer />
        <Toaster />
      </TooltipProvider>
    </CartProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const location = useLocation();
  const currentUrl = `${location.pathname}${location.search}`;

  // 404 із loader-ів (невідомий товар, колекція, сторінка) виглядає так само, як будь-яка інша 404.
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <main id="main-content" tabIndex={-1} className="flex-1 py-12 outline-none">
        <NotFound />
      </main>
    );
  }

  const stack = import.meta.env.DEV && error instanceof Error ? error.stack : undefined;

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 py-12 outline-none">
      <Container>
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <TriangleAlert strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle as="h1">Щось пішло не так</EmptyTitle>
            <EmptyDescription>
              Сторінка не завантажилась через помилку на нашому боці. Оновіть її або поверніться на
              головну. Якщо помилка повторюється, напишіть нам у Telegram.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <a href={currentUrl}>Оновити сторінку</a>
            </Button>
            <Button asChild variant="secondary">
              <a href="/">На головну</a>
            </Button>
          </EmptyContent>
        </Empty>
        {stack ? (
          <pre className="mt-6 w-full overflow-x-auto rounded-md border border-line bg-surface p-4 text-caption">
            <code>{stack}</code>
          </pre>
        ) : null}
      </Container>
    </main>
  );
}
