import { CollectionProvider } from "@shopify/hydrogen/react";
import { useTransitionDetail } from "~/lib/view-transition";
import { useNavigate, useSearchParams } from "react-router";

import { CollectionPage } from "~/components/collection/collection-page";
import { JsonLd } from "~/components/seo/json-ld";
import { STORE_INFO } from "~/lib/content/site";
import { useNonce } from "~/lib/csp";
import { catalogBreadcrumbJsonLd, collectionCrumbs, collectionItemListJsonLd } from "~/lib/seo";
import { AFTER_PARAM, BEFORE_PARAM, collectionPath, collectionSeo } from "~/lib/shopify/collection";
import { loadCollectionPage } from "~/lib/shopify/load-collection";
import { storefrontClientContext } from "~/lib/storefront";

import type { Route } from "./+types/collection";

export function meta({ loaderData }: Route.MetaArgs) {
  // Без даних сторінку малює ErrorBoundary (404 чи помилка): її не індексуємо.
  if (!loaderData) {
    return [
      { title: `Сторінку не знайдено — ${STORE_INFO.name}` },
      { name: "robots", content: "noindex" },
    ];
  }

  const { collection, origin, indexable } = loaderData;
  const { title, description } = collectionSeo(collection, STORE_INFO.name);
  // Фільтри, сортування й сторінки пагінації вказують на чисту адресу колекції.
  const canonical = `${origin}${collectionPath(collection.handle)}`;

  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: canonical },
    { tagName: "link", rel: "alternate", hrefLang: "uk", href: canonical },
    ...(indexable ? [] : [{ name: "robots", content: "noindex, follow" }]),
    { property: "og:type", content: "website" },
    { property: "og:locale", content: "uk_UA" },
    { property: "og:site_name", content: STORE_INFO.name },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: canonical },
    ...(collection.image ? [{ property: "og:image", content: collection.image.url }] : []),
  ];
}

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const handle = params.handle;
  if (!handle) throw new Response("Колекцію не знайдено", { status: 404 });

  const storefrontClient = context.get(storefrontClientContext);
  return loadCollectionPage({ storefrontClient, handle, request });
}

export default function CollectionRoute({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nonce = useNonce();
  const { collection, products, origin, dataSearch } = loaderData;
  const transitionDetail = useTransitionDetail("collection", collection.handle);
  const crumbs = collectionCrumbs(collection);

  return (
    <CollectionProvider
      data={{ handle: collection.handle, dataSearch }}
      urlSearch={searchParams.toString()}
      onChange={(search) => {
        // Нові фільтри чи сортування починаються з першої сторінки.
        const next = new URLSearchParams(search);
        next.delete(AFTER_PARAM);
        next.delete(BEFORE_PARAM);
        const nextSearch = next.toString();
        void navigate(
          { search: nextSearch ? `?${nextSearch}` : "" },
          // Перша зміна додає запис в історію, наступні його замінюють: «назад» веде з каталогу.
          { replace: searchParams.size > 0, preventScrollReset: true },
        );
      }}
    >
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 pt-2 pb-12 outline-none md:pb-16"
        // Заголовок сторінки (data-vt-detail) бере звідси назву переходу з картки колекції.
        {...transitionDetail}
      >
        {/* key: нова колекція починає з чистого стану довантаження та згорнутих груп. */}
        <CollectionPage key={collection.handle} data={loaderData} crumbs={crumbs} />
        <JsonLd
          nonce={nonce}
          data={[
            catalogBreadcrumbJsonLd(crumbs, origin),
            collectionItemListJsonLd(collection, products, origin),
          ]}
        />
      </main>
    </CollectionProvider>
  );
}
