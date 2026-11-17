import { describe, expect, it } from "vitest";

import type { ProductCardData } from "~/components/product/product-card";
import { STORE_INFO } from "~/lib/content/site";

import {
  electronicsStoreJsonLd,
  faqPageJsonLd,
  itemListJsonLd,
  organizationJsonLd,
  webSiteJsonLd,
} from "./json-ld";

const ORIGIN = "https://sad.example";

const PRODUCTS: ProductCardData[] = [
  {
    handle: "iphone-17-pro-256-blue",
    title: "iPhone 17 Pro 256 ГБ, синій титан",
    image: { url: "https://cdn.shopify.com/iphone.png" },
    price: { amount: "64999", currencyCode: "UAH" },
    availableForSale: true,
  },
  {
    handle: "airpods-pro-3",
    title: "AirPods Pro 3",
    image: null,
    price: { amount: "11999", currencyCode: "UAH" },
    availableForSale: true,
  },
];

describe("organizationJsonLd", () => {
  it("містить контактну точку, sameAs і юридичні дані", () => {
    expect(organizationJsonLd(STORE_INFO, ORIGIN)).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://sad.example/#organization",
      name: "Ionov Store",
      legalName: "ФОП Іонов О. В.",
      taxID: "3214509876",
      url: "https://sad.example/",
      logo: "https://sad.example/favicon.svg",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+380681299900",
        contactType: "customer service",
        areaServed: "UA",
        availableLanguage: ["uk"],
      },
      sameAs: ["https://t.me/ionov_store"],
    });
  });

  it("не дублює слеш, якщо origin закінчується на «/»", () => {
    expect(organizationJsonLd(STORE_INFO, `${ORIGIN}/`).url).toBe("https://sad.example/");
  });
});

describe("webSiteJsonLd", () => {
  it("описує SearchAction на /search?q={search_term_string}", () => {
    const data = webSiteJsonLd(ORIGIN);

    expect(data["@type"]).toBe("WebSite");
    expect(data.inLanguage).toBe("uk-UA");
    expect(data.potentialAction).toEqual({
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://sad.example/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    });
  });
});

describe("electronicsStoreJsonLd", () => {
  it("містить адресу, координати, години роботи, телефон і карту", () => {
    const data = electronicsStoreJsonLd(STORE_INFO, ORIGIN);

    expect(data["@type"]).toBe("ElectronicsStore");
    expect(data.telephone).toBe("+380681299900");
    expect(data.address).toEqual({
      "@type": "PostalAddress",
      streetAddress: "вул. Соборна, 64",
      addressLocality: "Вінниця",
      postalCode: "21050",
      addressCountry: "UA",
    });
    expect(data.geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: 49.2331,
      longitude: 28.4682,
    });
    expect(data.openingHours).toBe("Mo-Su 10:00-20:00");
    expect(data.openingHoursSpecification).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "10:00",
        closes: "20:00",
      },
    ]);
    expect(data.hasMap).toBe("https://www.google.com/maps/search/?api=1&query=49.2331,28.4682");
    expect(data.parentOrganization).toEqual({ "@id": "https://sad.example/#organization" });
  });
});

describe("faqPageJsonLd", () => {
  it("перетворює питання й відповіді на Question / Answer", () => {
    expect(faqPageJsonLd([{ question: "Яка гарантія?", answer: "12 місяців." }])).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Яка гарантія?",
          acceptedAnswer: { "@type": "Answer", text: "12 місяців." },
        },
      ],
    });
  });
});

describe("itemListJsonLd", () => {
  it("нумерує товари з 1 і будує абсолютні адреси", () => {
    const data = itemListJsonLd(PRODUCTS, ORIGIN);

    expect(data.numberOfItems).toBe(2);
    expect(data.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "iPhone 17 Pro 256 ГБ, синій титан",
        url: "https://sad.example/products/iphone-17-pro-256-blue",
        image: "https://cdn.shopify.com/iphone.png",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "AirPods Pro 3",
        url: "https://sad.example/products/airpods-pro-3",
      },
    ]);
  });

  it("повертає серіалізовні об'єкти", () => {
    const data = itemListJsonLd(PRODUCTS, ORIGIN);

    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
  });
});
