import type { ProductCardData } from "~/components/product/product-card";
import { mapsUrl, type StoreInfo } from "~/lib/content/site";

/** Вузол schema.org. Чисті функції нижче повертають звичайні об'єкти без побічних ефектів. */
export type JsonLdObject = { "@context": "https://schema.org"; "@type": string } & Record<
  string,
  unknown
>;

const CONTEXT = "https://schema.org";
const LANGUAGE = "uk-UA";
const COUNTRY = "UA";
const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** «https://sad.ua/» → «https://sad.ua». */
function baseUrl(origin: string): string {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

/** «tel:+380681299900» → «+380681299900». */
function telephone(store: StoreInfo): string {
  return store.phoneHref.startsWith("tel:") ? store.phoneHref.slice(4) : store.phoneHref;
}

export function organizationId(origin: string): string {
  return `${baseUrl(origin)}/#organization`;
}

export function organizationJsonLd(store: StoreInfo, origin: string): JsonLdObject {
  const url = baseUrl(origin);

  return {
    "@context": CONTEXT,
    "@type": "Organization",
    "@id": organizationId(origin),
    name: store.name,
    legalName: store.legalName,
    taxID: store.taxId,
    url: `${url}/`,
    logo: `${url}/favicon.svg`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: telephone(store),
      contactType: "customer service",
      areaServed: COUNTRY,
      availableLanguage: ["uk"],
    },
    sameAs: [store.telegramUrl],
  };
}

export function webSiteJsonLd(origin: string, name = "Ionov Store"): JsonLdObject {
  const url = baseUrl(origin);

  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": `${url}/#website`,
    name,
    url: `${url}/`,
    inLanguage: LANGUAGE,
    publisher: { "@id": organizationId(origin) },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function electronicsStoreJsonLd(store: StoreInfo, origin: string): JsonLdObject {
  const url = baseUrl(origin);

  return {
    "@context": CONTEXT,
    "@type": "ElectronicsStore",
    "@id": `${url}/#store`,
    name: store.name,
    url: `${url}/`,
    image: `${url}/favicon.svg`,
    telephone: telephone(store),
    currenciesAccepted: "UAH",
    parentOrganization: { "@id": organizationId(origin) },
    address: {
      "@type": "PostalAddress",
      streetAddress: store.street,
      addressLocality: store.city,
      postalCode: store.postalCode,
      addressCountry: COUNTRY,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: store.latitude,
      longitude: store.longitude,
    },
    openingHours: `Mo-Su ${store.opens}-${store.closes}`,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: WEEK,
        opens: store.opens,
        closes: store.closes,
      },
    ],
    hasMap: mapsUrl(store),
  };
}

export function faqPageJsonLd(items: { question: string; answer: string }[]): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/** Список популярних товарів: позиція, назва й адреса сторінки товару. */
export function itemListJsonLd(
  products: ProductCardData[],
  origin: string,
  name = "Популярні товари",
): JsonLdObject {
  const url = baseUrl(origin);

  return {
    "@context": CONTEXT,
    "@type": "ItemList",
    name,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.title,
      url: `${url}/products/${product.handle}`,
      ...(product.image ? { image: product.image.url } : {}),
    })),
  };
}
