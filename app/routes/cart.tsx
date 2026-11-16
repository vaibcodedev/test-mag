import { CartPage } from "~/components/cart/cart-page";
import { STORE_INFO } from "~/lib/content/site";

import type { Route } from "./+types/cart";

const TITLE = `Кошик — ${STORE_INFO.name}`;
const DESCRIPTION =
  "Товари у вашому кошику: змініть кількість і перейдіть до оформлення. Доставка по Україні завтра, оплата частинами до 25 платежів.";

export function meta({ loaderData }: Route.MetaArgs) {
  const url = `${loaderData?.origin ?? ""}/cart`;

  return [
    { title: TITLE },
    { name: "description", content: DESCRIPTION },
    // Кошик у кожного свій: у пошуку йому не місце.
    { name: "robots", content: "noindex, follow" },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: "uk_UA" },
    { property: "og:site_name", content: STORE_INFO.name },
    { property: "og:title", content: TITLE },
    { property: "og:description", content: DESCRIPTION },
    { property: "og:url", content: url },
  ];
}

// Сам кошик читає кореневий loader і передає в CartProvider: тут потрібна лише адреса сайту.
export function loader({ request }: Route.LoaderArgs) {
  return { origin: new URL(request.url).origin };
}

export default function CartRoute() {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 pt-6 pb-section outline-none">
      <CartPage />
    </main>
  );
}
