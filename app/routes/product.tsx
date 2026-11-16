import { ProductPage } from "~/components/product/product-page";
import { JsonLd } from "~/components/seo/json-ld";
import { useNonce } from "~/lib/csp";
import { breadcrumbListJsonLd, productCanonicalUrl, productJsonLd } from "~/lib/seo";
import { shopifyImageUrl } from "~/lib/shopify/image";
import { loadProductPage } from "~/lib/shopify/load-product";
import {
  productBreadcrumbs,
  productMetaDescription,
  productMetaTitle,
  productOgVideo,
  toProductJsonLdInput,
} from "~/lib/shopify/product";
import { storefrontClientContext } from "~/lib/storefront";

import type { Route } from "./+types/product";

const SITE_NAME = "Сад";
const OG_IMAGE_WIDTH = 1200;

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) {
    return [{ title: `Товар не знайдено | ${SITE_NAME}` }, { name: "robots", content: "noindex" }];
  }

  const { product, origin } = loaderData;
  const title = productMetaTitle(product.title);
  const description = productMetaDescription(product);
  // Канонічна адреса без параметрів варіанта: усі варіанти — одна сторінка для пошуковика.
  const canonical = productCanonicalUrl(product.handle, origin);
  const variant = product.selectedOrFirstAvailableVariant;
  const price = variant?.price ?? product.priceRange.minVariantPrice;
  const image = product.featuredImage;
  const video = productOgVideo(product);

  return [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: canonical },
    { tagName: "link", rel: "alternate", hrefLang: "uk", href: canonical },
    { property: "og:type", content: "product" },
    { property: "og:locale", content: "uk_UA" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: canonical },
    { property: "product:price:amount", content: price.amount },
    { property: "product:price:currency", content: price.currencyCode },
    ...(image
      ? [
          {
            property: "og:image",
            content: shopifyImageUrl(image.url, { width: OG_IMAGE_WIDTH }),
          },
          { property: "og:image:alt", content: image.altText || product.title },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : []),
    // Лише відео, завантажене в Shopify: у нього є пряма адреса файла.
    ...(video
      ? [
          { property: "og:video", content: video.url },
          { property: "og:video:type", content: video.mimeType },
          ...(video.width && video.height
            ? [
                { property: "og:video:width", content: String(video.width) },
                { property: "og:video:height", content: String(video.height) },
              ]
            : []),
        ]
      : []),
  ];
}

export async function loader({ context, params, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = params.handle
    ? await loadProductPage(context.get(storefrontClientContext), params.handle, url.searchParams)
    : null;

  if (!page) throw new Response("Not Found", { status: 404 });

  return { ...page, origin: url.origin };
}

export default function Product({ loaderData }: Route.ComponentProps) {
  const { product, related, origin } = loaderData;
  const nonce = useNonce();

  return (
    <>
      <ProductPage product={product} related={related} />
      <JsonLd
        nonce={nonce}
        data={[
          productJsonLd(toProductJsonLdInput(product), origin),
          breadcrumbListJsonLd(productBreadcrumbs(product), origin),
        ]}
      />
    </>
  );
}
