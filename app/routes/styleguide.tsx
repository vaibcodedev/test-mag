import { Cache } from "@shopify/hydrogen";

import { Container } from "~/components/layout/container";
import {
  ActionsSection,
  CommerceSection,
  DataSection,
  FormsSection,
  NavigationSection,
  OverlaysSection,
  ProductCardsSection,
  StyleguideHeader,
  TokensSection,
} from "~/components/styleguide";
import { STYLEGUIDE_PRODUCTS_QUERY } from "~/graphql/queries/styleguide.query";
import { storefrontClientContext } from "~/lib/storefront";

import type { Route } from "./+types/styleguide";

const DEMO_IMAGE_COUNT = 5;

export function meta() {
  return [
    { title: "UI-кіт — Ionov Store" },
    { name: "description", content: "Токени та компоненти дизайн-системи магазинв Ionov Store." },
    { name: "robots", content: "noindex, nofollow" },
  ];
}

/** Службова сторінка: поза індексом і для тих пошуковиків, що читають лише заголовки. */
export function headers() {
  return { "X-Robots-Tag": "noindex, nofollow" };
}

export async function loader({ context }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);
  const { data } = await storefrontClient.graphql(STYLEGUIDE_PRODUCTS_QUERY, {
    variables: { first: DEMO_IMAGE_COUNT },
    cache: Cache.long(),
  });

  return {
    images: (data?.products?.nodes ?? []).flatMap((product) =>
      product.featuredImage ? [product.featuredImage] : [],
    ),
  };
}

export default function Styleguide({ loaderData }: Route.ComponentProps) {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 py-12 outline-none">
      <Container className="flex flex-col gap-section">
        <StyleguideHeader />
        <TokensSection />
        <ActionsSection />
        <CommerceSection />
        <DataSection images={loaderData.images} />
        <FormsSection />
        <OverlaysSection />
        <NavigationSection />
        <ProductCardsSection images={loaderData.images} />
      </Container>
    </main>
  );
}
