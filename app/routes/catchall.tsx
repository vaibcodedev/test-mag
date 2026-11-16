import { data } from "react-router";

import { NotFound } from "~/components/layout/not-found";

export function meta() {
  return [{ title: "Сторінку не знайдено — Сад" }, { name: "robots", content: "noindex" }];
}

/**
 * Статус 404 віддає loader, а не викинута відповідь: так сторінку малює цей маршрут
 * у звичайному каркасі сайту. Middleware в root.tsx бачить 404 і спершу перевіряє
 * редиректи Shopify (handleShopifyRedirects).
 */
export function loader() {
  return data(null, { status: 404 });
}

export default function CatchAllRoute() {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 py-12 outline-none">
      <NotFound />
    </main>
  );
}
