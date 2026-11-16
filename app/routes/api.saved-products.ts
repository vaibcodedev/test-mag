import type { SavedProductsError, SavedProductsResponse } from "~/lib/saved-lists";
import { loadSavedProducts, parseHandlesParam } from "~/lib/shopify/saved-products";
import { storefrontClientContext } from "~/lib/storefront";

import type { Route } from "./+types/api.saved-products";

/**
 * Відповідь не кешується ні в браузері, ні на CDN: набір handle у кожного відвідувача свій
 * (спільний кеш майже не влучав би), на реальному магазині ціна залежить від контексту покупця,
 * а на сторінках із кнопкою «Купити» ціна й наявність мають бути актуальними.
 */
const HEADERS = { "Cache-Control": "private, no-store" };

function json(body: SavedProductsResponse | SavedProductsError, status = 200) {
  return Response.json(body, { status, headers: HEADERS });
}

/** GET /api/saved-products?handles=a,b,c — товари для обраного й порівняння, що живуть у браузері. */
export async function loader({ context, request }: Route.LoaderArgs) {
  const parsed = parseHandlesParam(new URL(request.url).searchParams.get("handles"));
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  try {
    const products = await loadSavedProducts(context.get(storefrontClientContext), parsed.handles);
    return json({ products });
  } catch (error) {
    console.error(error);
    return json({ error: "Не вдалося завантажити товари. Спробуйте ще раз за хвилину." }, 502);
  }
}
