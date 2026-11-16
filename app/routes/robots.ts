// Каталог сортується параметром `sort_by`, а фільтрується параметрами `filter.*`
// (див. app/lib/shopify/collection.ts). Такі адреси дублюють сторінку колекції,
// тому для звичайних роботів закриті всі; канонічна адреса колекції лишається відкритою.
const RULES = `User-agent: *
Disallow: /admin
Disallow: /cart
Disallow: /account
Disallow: /checkout
Disallow: /buy/
Disallow: /api/
Disallow: /__shopify
Disallow: /search
Disallow: /styleguide
Disallow: /wishlist
Disallow: /compare
Disallow: /collections/*?*sort_by=
Disallow: /collections/*?*filter.

# Google AdsBot ignores the "*" group and follows only groups that name it.
User-agent: adsbot-google
Disallow: /cart
Disallow: /account
Disallow: /checkout
Disallow: /search
`;

/** Адреса sitemap має бути абсолютною, тому береться з origin запиту. */
export function buildRobotsTxt(origin: string): string {
  return `${RULES}\nSitemap: ${origin}/sitemap.xml\n`;
}

export function loader({ request }: { request: Request }) {
  return new Response(buildRobotsTxt(new URL(request.url).origin), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": `public, max-age=${60 * 60 * 24}`,
    },
  });
}
