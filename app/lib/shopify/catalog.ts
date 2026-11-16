import { Cache } from "@shopify/hydrogen";

import type { MegaMenuCategory } from "~/components/layout/mega-menu";
import { LAYOUT_CATALOG_QUERY } from "~/graphql/queries/home.query";
import { CATALOG_LINKS } from "~/lib/content/site";
import type { StorefrontGraphqlClient } from "~/lib/storefront";

import { optionalData } from "./errors";

const COLLECTION_LIMIT = 20;

/**
 * Категорії для шапки. Фото береться з колекції з тим самим handle.
 * TODO(реальний магазин): прибрати запасні фото товарів — вони потрібні лише на mock.shop,
 * де колекцій iphone / mac / ipad … немає.
 *
 * Фото — другорядна частина шапки: якщо запит не вдався, меню лишається без фото,
 * а помилка потрапляє в журнал. Самі посилання меню від магазину не залежать.
 */
export async function loadCatalog(
  storefrontClient: StorefrontGraphqlClient,
): Promise<MegaMenuCategory[]> {
  const data = await optionalData("LayoutCatalog", () =>
    storefrontClient.graphql(LAYOUT_CATALOG_QUERY, {
      variables: { collections: COLLECTION_LIMIT, products: CATALOG_LINKS.length },
      cache: Cache.long(),
    }),
  );

  const collectionImages = new Map(
    (data?.collections?.nodes ?? []).map((collection) => [collection.handle, collection.image]),
  );
  const fallbackImages = (data?.products?.nodes ?? []).map((product) => product.featuredImage);

  return CATALOG_LINKS.map((link, index) => {
    const handle = link.to.split("/").pop() ?? "";
    return {
      ...link,
      image:
        collectionImages.get(handle) ??
        fallbackImages[index % (fallbackImages.length || 1)] ??
        null,
    };
  });
}
