import { Cache } from "@shopify/hydrogen";

import type { MegaMenuCategory } from "~/components/layout/mega-menu";
import { LAYOUT_CATALOG_QUERY } from "~/graphql/queries/home.query";
import { CATALOG_LINKS } from "~/lib/content/site";
import type { StorefrontGraphqlClient } from "~/lib/storefront";

import { optionalData } from "./errors";

const COLLECTION_LIMIT = 20;

/**
 * Категорії для шапки. Фото береться з колекції з тим самим handle: її власне фото,
 * а якщо його немає — фото першого товару цієї колекції. Чужих товарів не підставляємо:
 * категорія без колекції лишається без фото.
 *
 * Фото — другорядна частина шапки: якщо запит не вдався, меню лишається без фото,
 * а помилка потрапляє в журнал. Самі посилання меню від магазину не залежать.
 */
export async function loadCatalog(
  storefrontClient: StorefrontGraphqlClient,
): Promise<MegaMenuCategory[]> {
  const data = await optionalData("LayoutCatalog", () =>
    storefrontClient.graphql(LAYOUT_CATALOG_QUERY, {
      variables: { collections: COLLECTION_LIMIT },
      cache: Cache.long(),
    }),
  );

  const collectionImages = new Map(
    (data?.collections?.nodes ?? []).map((collection) => [
      collection.handle,
      collection.image ?? collection.products.nodes[0]?.featuredImage ?? null,
    ]),
  );

  return CATALOG_LINKS.map((link) => {
    const handle = link.to.split("/").pop() ?? "";
    return { ...link, image: collectionImages.get(handle) ?? null };
  });
}
