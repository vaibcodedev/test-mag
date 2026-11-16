import { buildSitemapXml, loadSitemapEntries } from "~/lib/shopify/sitemap";
import { storefrontClientContext } from "~/lib/storefront";

import type { Route } from "./+types/sitemap";

const HOUR = 60 * 60;

/**
 * /sitemap.xml: товари, колекції, сторінки й статті магазину плюс статичні сторінки.
 *
 * Якщо магазин не відповів, віддаємо 503 без кешування, а не карту з самих статичних сторінок:
 * пошуковик повторить запит пізніше і не вирішить, що каталог зник.
 */
export async function loader({ context, request }: Route.LoaderArgs) {
  let entries;
  try {
    entries = await loadSitemapEntries(context.get(storefrontClientContext));
  } catch (error) {
    // Відповідь 5xx із завантажувача вже записана в журнал; решта — збій мережі чи тайм-аут.
    if (!(error instanceof Response)) console.error("[storefront] sitemap.xml:", error);
    return new Response("Карта сайту тимчасово недоступна. Спробуйте пізніше.", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "300",
      },
    });
  }

  return new Response(buildSitemapXml(entries, new URL(request.url).origin), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, max-age=${HOUR}`,
    },
  });
}
