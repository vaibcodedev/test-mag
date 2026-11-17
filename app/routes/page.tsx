import { PageLayout } from "~/components/content/page-layout";
import { PageNav } from "~/components/content/page-nav";
import { ContentBodyView } from "~/components/content/rich-text";
import { ShowroomBlock } from "~/components/content/showroom-block";
import { JsonLd } from "~/components/seo/json-ld";
import { CONTACTS_PAGE_HANDLE, isServicePageHandle, SERVICE_PAGES } from "~/lib/content/pages";
import { STORE_INFO } from "~/lib/content/site";
import { useNonce } from "~/lib/csp";
import { contentMeta } from "~/lib/seo/content-meta";
import { breadcrumbListJsonLd } from "~/lib/seo/product-json-ld";
import { loadContentPage } from "~/lib/shopify/content";
import { storefrontClientContext } from "~/lib/storefront";

import type { Route } from "./+types/page";

const SERVICE_NAV = SERVICE_PAGES.map((page) => ({
  title: page.title,
  to: `/pages/${page.handle}`,
}));

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Сторінку не знайдено — Ionov Store" }];
  const { page, origin, path } = loaderData;

  return contentMeta({
    title: page.seoTitle ?? page.title,
    description: page.description || page.title,
    path,
    origin,
  });
}

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const page = await loadContentPage(context.get(storefrontClientContext), params.handle);
  if (!page) throw new Response("Сторінку не знайдено", { status: 404 });

  const path = `/pages/${page.handle}`;

  return {
    page,
    path,
    origin: new URL(request.url).origin,
    store: STORE_INFO,
    breadcrumbs: [
      { title: "Головна", to: "/" },
      { title: page.title, to: path },
    ],
  };
}

export default function Page({ loaderData }: Route.ComponentProps) {
  const { page, path, origin, store, breadcrumbs } = loaderData;
  const nonce = useNonce();
  const isContacts = page.handle === CONTACTS_PAGE_HANDLE;

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 pt-4 outline-none">
      <PageLayout
        breadcrumbs={breadcrumbs}
        title={page.title}
        lead={page.source === "fallback" ? page.description : null}
        store={store}
        showroomLink={!isContacts}
        nav={
          isServicePageHandle(page.handle) ? <PageNav links={SERVICE_NAV} current={path} /> : null
        }
        after={isContacts ? <ShowroomBlock store={store} /> : null}
      >
        <ContentBodyView body={page.body} />
      </PageLayout>

      <JsonLd nonce={nonce} data={breadcrumbListJsonLd(breadcrumbs, origin)} />
    </main>
  );
}
