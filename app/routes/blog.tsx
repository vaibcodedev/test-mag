import { BlogView } from "~/components/content/blog-view";
import { JsonLd } from "~/components/seo/json-ld";
import { useNonce } from "~/lib/csp";
import { contentMeta } from "~/lib/seo/content-meta";
import { breadcrumbListJsonLd } from "~/lib/seo/product-json-ld";
import { loadBlog } from "~/lib/shopify/content";
import { storefrontClientContext } from "~/lib/storefront";

import type { Route } from "./+types/blog";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Сторінку не знайдено — Ionov Store" }];
  const { blog, origin, path } = loaderData;

  return contentMeta({
    title: blog.seoTitle ?? `${blog.title}: поради про техніку Apple`,
    description: blog.description,
    path,
    origin,
    // Наступні сторінки списку не індексуємо: курсори в адресі нестабільні.
    noindex: blog.paginated,
  });
}

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const blog = await loadBlog(
    context.get(storefrontClientContext),
    params.blog,
    url.searchParams,
    url,
  );
  if (!blog) throw new Response("Блог не знайдено", { status: 404 });

  const path = `/blogs/${blog.handle}`;
  const pageHref = (name: "before" | "after", cursor: string | null) =>
    cursor ? `${path}?${name}=${encodeURIComponent(cursor)}` : null;

  return {
    blog,
    path,
    origin: url.origin,
    newerHref: pageHref("before", blog.newerCursor),
    olderHref: pageHref("after", blog.olderCursor),
    breadcrumbs: [
      { title: "Головна", to: "/" },
      { title: blog.title, to: path },
    ],
  };
}

export default function Blog({ loaderData }: Route.ComponentProps) {
  const { blog, origin, newerHref, olderHref, breadcrumbs } = loaderData;
  const nonce = useNonce();

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 pt-4 outline-none">
      <BlogView
        breadcrumbs={breadcrumbs}
        title={blog.title}
        description={blog.description}
        blogHandle={blog.handle}
        articles={blog.articles}
        newerHref={newerHref}
        olderHref={olderHref}
      />

      <JsonLd nonce={nonce} data={breadcrumbListJsonLd(breadcrumbs, origin)} />
    </main>
  );
}
