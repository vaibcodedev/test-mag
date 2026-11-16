import { CollectionList } from "~/components/collection/collection-card";
import { CollectionHeader } from "~/components/collection/collection-header";
import { Container } from "~/components/layout/container";
import { JsonLd } from "~/components/seo/json-ld";
import { STORE_INFO } from "~/lib/content/site";
import { useNonce } from "~/lib/csp";
import { catalogBreadcrumbJsonLd, catalogCrumbs } from "~/lib/seo";
import { loadCollectionsPage } from "~/lib/shopify/load-collection";
import { storefrontClientContext } from "~/lib/storefront";

import type { Route } from "./+types/collections";

const TITLE = `Каталог техніки Apple у Вінниці — ${STORE_INFO.name}`;
const DESCRIPTION =
  "Увесь каталог магазину «Сад»: iPhone, Mac, iPad, Watch, AirPods, аксесуари та вживані пристрої. Оплата частинами, гарантія 12 місяців, доставка по Україні.";
const INTRO = "Оберіть категорію — далі допоможуть фільтри за ціною, пам'яттю, кольором і станом.";

export function meta({ loaderData }: Route.MetaArgs) {
  const canonical = `${loaderData?.origin ?? ""}/collections`;

  return [
    { title: TITLE },
    { name: "description", content: DESCRIPTION },
    { tagName: "link", rel: "canonical", href: canonical },
    { tagName: "link", rel: "alternate", hrefLang: "uk", href: canonical },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: "uk_UA" },
    { property: "og:site_name", content: STORE_INFO.name },
    { property: "og:title", content: TITLE },
    { property: "og:description", content: DESCRIPTION },
    { property: "og:url", content: canonical },
  ];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  return loadCollectionsPage({ storefrontClient, request });
}

export default function CollectionsRoute({ loaderData }: Route.ComponentProps) {
  const nonce = useNonce();
  const crumbs = catalogCrumbs();

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 pt-2 pb-12 outline-none md:pb-16">
      <Container className="flex flex-col gap-6 md:gap-8">
        <CollectionHeader crumbs={crumbs} title="Каталог" description={INTRO} />
        <CollectionList collections={loaderData.collections} />
      </Container>
      <JsonLd nonce={nonce} data={catalogBreadcrumbJsonLd(crumbs, loaderData.origin)} />
    </main>
  );
}
