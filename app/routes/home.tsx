import { useRouteLoaderData } from "react-router";

import { About } from "~/components/home/about";
import { Articles } from "~/components/home/articles";
import { CategoryBento } from "~/components/home/category-bento";
import { Deals } from "~/components/home/deals";
import { Faq } from "~/components/home/faq";
import { HeroArea } from "~/components/home/hero-area";
import { IphoneLineup } from "~/components/home/iphone-lineup";
import { Newsletter } from "~/components/home/newsletter";
import { PopularProducts } from "~/components/home/popular-products";
import { Reviews } from "~/components/home/reviews";
import { SeoBlock } from "~/components/home/seo-block";
import { Services } from "~/components/home/services";
import { Showroom } from "~/components/home/showroom";
import { UsedDevices } from "~/components/home/used-devices";
import { UspStrip } from "~/components/home/usp-strip";
import { JsonLd } from "~/components/seo/json-ld";
import { useAddToCart } from "~/hooks/use-add-to-cart";
import { STORE_INFO } from "~/lib/content/site";
import { useNonce } from "~/lib/csp";
import {
  electronicsStoreJsonLd,
  faqPageJsonLd,
  itemListJsonLd,
  organizationJsonLd,
  webSiteJsonLd,
} from "~/lib/seo";
import { loadHomeContent } from "~/lib/shopify/home-content";
import { loadHomeProducts } from "~/lib/shopify/load-home";
import { storefrontClientContext } from "~/lib/storefront";
import type { loader as rootLoader } from "~/root";

import type { Route } from "./+types/home";

const TITLE = "Сад — техніка Apple у Вінниці з гарантією 12 місяців";
const DESCRIPTION =
  "iPhone, Mac, iPad, Watch і AirPods у шоурумі на Соборній, 64 та з доставкою по Україні завтра. Оплата частинами до 25 платежів, trade-in, гарантія 12 місяців.";
const H1 =
  "Інтернет-магазин техніки Apple у Вінниці та по Україні — з гарантією 12 місяців і доставкою завтра";

export function meta({ loaderData }: Route.MetaArgs) {
  const origin = loaderData?.origin ?? "";

  return [
    { title: TITLE },
    { name: "description", content: DESCRIPTION },
    { tagName: "link", rel: "canonical", href: `${origin}/` },
    { tagName: "link", rel: "alternate", hrefLang: "uk", href: `${origin}/` },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: "uk_UA" },
    { property: "og:site_name", content: loaderData?.content.store.name ?? STORE_INFO.name },
    { property: "og:title", content: TITLE },
    { property: "og:description", content: DESCRIPTION },
    { property: "og:url", content: `${origin}/` },
  ];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const storefrontClient = context.get(storefrontClientContext);

  const [content, products] = await Promise.all([
    loadHomeContent(storefrontClient),
    loadHomeProducts(storefrontClient),
  ]);

  return { origin: new URL(request.url).origin, content, products };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { content, products, origin } = loaderData;
  const catalog = useRouteLoaderData<typeof rootLoader>("root")?.catalog ?? [];
  const nonce = useNonce();
  const { addToCart, addingHandle } = useAddToCart();
  // Товарні плитки, рядок знижок і фото iPhone — з магазину; запасний вміст лише там, де їх немає.
  const promo = {
    ...content.promo,
    newProduct: products.promoNew ?? content.promo.newProduct,
    saleProduct: products.promoSale ?? content.promo.saleProduct,
  };
  const tickerItems = products.ticker.length > 0 ? products.ticker : content.deals.tickerItems;
  const iphoneLineup = content.iphoneLineup.map((model) => ({
    ...model,
    ...products.iphones[model.to.split("/").pop() ?? ""],
  }));

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex flex-1 flex-col gap-section pt-4 outline-none"
    >
      <HeroArea title={H1} banners={content.banners} promo={promo} categories={catalog} />

      <UspStrip usps={content.usps} />
      <CategoryBento {...content.bento} />
      {/* Без товарів у колекції deals секції немає: вигаданих знижок не показуємо. */}
      {products.deals.length > 0 ? (
        <Deals
          content={content.deals.content}
          tickerItems={tickerItems}
          products={products.deals}
          endsAt={products.dealsEndAt}
          now={products.now}
          onAddToCart={addToCart}
          addingHandle={addingHandle}
        />
      ) : null}
      <PopularProducts
        content={content.popular.content}
        tabs={content.popular.tabs}
        products={products.popular}
        onAddToCart={addToCart}
        addingHandle={addingHandle}
      />
      {/* Так само з вживаною технікою: секція є лише тоді, коли в колекції used є товари. */}
      {products.used.length > 0 ? (
        <UsedDevices
          content={content.used.content}
          products={products.used}
          onAddToCart={addToCart}
          addingHandle={addingHandle}
        />
      ) : null}
      <IphoneLineup models={iphoneLineup} />
      <Services content={content.services} />
      <About {...content.about} />
      <Reviews rating={content.reviews.rating} reviews={content.reviews.items} />
      <Articles content={content.articles.content} articles={content.articles.items} />
      <Faq items={content.faq.items} description={content.faq.description} />
      <Showroom
        store={content.store}
        description={content.showroom.description}
        delivery={content.showroom.delivery}
      />
      <SeoBlock {...content.seo} />
      {/* Розсилку ще не підключено: без onSubmit форма чесно каже, що підписки поки немає. */}
      <Newsletter content={content.newsletter} telegramUrl={content.store.telegramUrl} />

      <JsonLd
        nonce={nonce}
        data={[
          organizationJsonLd(content.store, origin),
          webSiteJsonLd(origin),
          electronicsStoreJsonLd(content.store, origin),
          faqPageJsonLd(content.faq.items),
          itemListJsonLd(products.popular, origin),
        ]}
      />
    </main>
  );
}
