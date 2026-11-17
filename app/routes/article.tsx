import { ArticleView } from "~/components/content/article-view";
import { JsonLd } from "~/components/seo/json-ld";
import { useNonce } from "~/lib/csp";
import { articleJsonLd } from "~/lib/seo/article-json-ld";
import { contentMeta } from "~/lib/seo/content-meta";
import { breadcrumbListJsonLd } from "~/lib/seo/product-json-ld";
import { loadArticle } from "~/lib/shopify/content";
import { storefrontClientContext } from "~/lib/storefront";

import type { Route } from "./+types/article";

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Статтю не знайдено — Ionov Store" }];
  const { article, origin, path } = loaderData;

  return contentMeta({
    title: article.seoTitle ?? article.title,
    description: article.description || article.title,
    path,
    origin,
    type: "article",
    image: article.image?.url,
    publishedAt: article.publishedAt,
  });
}

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const data = await loadArticle(context.get(storefrontClientContext), params.blog, params.handle);
  if (!data) throw new Response("Статтю не знайдено", { status: 404 });

  const blogPath = `/blogs/${data.blog.handle}`;
  const path = `${blogPath}/${data.article.handle}`;

  return {
    ...data,
    path,
    origin: new URL(request.url).origin,
    breadcrumbs: [
      { title: "Головна", to: "/" },
      { title: data.blog.title, to: blogPath },
      { title: data.article.title, to: path },
    ],
  };
}

export default function Article({ loaderData }: Route.ComponentProps) {
  const { blog, article, related, path, origin, breadcrumbs } = loaderData;
  const nonce = useNonce();

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 pt-4 outline-none">
      <ArticleView breadcrumbs={breadcrumbs} blog={blog} article={article} related={related} />

      <JsonLd
        nonce={nonce}
        data={[
          breadcrumbListJsonLd(breadcrumbs, origin),
          articleJsonLd(
            {
              path,
              title: article.title,
              description: article.description,
              image: article.image?.url,
              publishedAt: article.publishedAt,
              authorName: article.authorName,
              wordCount: article.wordCount,
            },
            origin,
          ),
        ]}
      />
    </main>
  );
}
