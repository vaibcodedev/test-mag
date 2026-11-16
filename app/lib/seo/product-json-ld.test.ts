import { describe, expect, it } from "vitest";

import {
  breadcrumbListJsonLd,
  productCanonicalUrl,
  productJsonLd,
  type ProductJsonLdInput,
} from "./product-json-ld";

const ORIGIN = "https://sad.example";

const PRODUCT: ProductJsonLdInput = {
  handle: "iphone-17-pro",
  title: "iPhone 17 Pro 256 ГБ, синій титан",
  description: "Смартфон з дисплеєм 6,3 дюйма.",
  images: ["https://cdn.shopify.com/iphone.png"],
  sku: "IP17P-256-BL",
  brand: "Apple",
  price: { amount: "64999.0", currencyCode: "UAH" },
  availableForSale: true,
};

describe("productCanonicalUrl", () => {
  it("будує адресу без параметрів варіанта й без подвійного слеша", () => {
    expect(productCanonicalUrl("iphone-17-pro", `${ORIGIN}/`)).toBe(
      "https://sad.example/products/iphone-17-pro",
    );
  });
});

describe("productJsonLd", () => {
  it("описує Product з Offer", () => {
    expect(productJsonLd(PRODUCT, ORIGIN)).toEqual({
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": "https://sad.example/products/iphone-17-pro#product",
      name: "iPhone 17 Pro 256 ГБ, синій титан",
      url: "https://sad.example/products/iphone-17-pro",
      description: "Смартфон з дисплеєм 6,3 дюйма.",
      image: ["https://cdn.shopify.com/iphone.png"],
      sku: "IP17P-256-BL",
      brand: { "@type": "Brand", name: "Apple" },
      offers: {
        "@type": "Offer",
        url: "https://sad.example/products/iphone-17-pro",
        price: "64999.00",
        priceCurrency: "UAH",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@id": "https://sad.example/#organization" },
      },
    });
  });

  it("не додає AggregateRating без справжніх відгуків", () => {
    expect(productJsonLd(PRODUCT, ORIGIN)).not.toHaveProperty("aggregateRating");
    expect(
      productJsonLd({ ...PRODUCT, rating: { value: 5, count: 0 } }, ORIGIN),
    ).not.toHaveProperty("aggregateRating");
  });

  it("додає AggregateRating, коли є рейтинг", () => {
    const data = productJsonLd({ ...PRODUCT, rating: { value: 4.9, count: 128 } }, ORIGIN);

    expect(data.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.9,
      reviewCount: 128,
      bestRating: 5,
      worstRating: 1,
    });
  });

  it("позначає відсутність у наявності та вживаний стан", () => {
    const data = productJsonLd({ ...PRODUCT, availableForSale: false, used: true }, ORIGIN);

    expect(data.offers).toMatchObject({
      availability: "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/UsedCondition",
    });
  });

  it("перелічує всі фото товару", () => {
    const images = ["https://cdn.shopify.com/a.png", "https://cdn.shopify.com/b.png"];

    expect(productJsonLd({ ...PRODUCT, images }, ORIGIN).image).toEqual(images);
  });

  it("описує відео Shopify як VideoObject з прямою адресою, без вигаданої дати", () => {
    const data = productJsonLd(
      {
        ...PRODUCT,
        video: {
          name: "Огляд камери",
          thumbnailUrl: "https://cdn.shopify.com/poster.jpg",
          contentUrl: "https://cdn.shopify.com/videos/c/vp/1/1.HD-1080p-7.2Mbps.mp4",
        },
      },
      ORIGIN,
    );

    expect(data.subjectOf).toEqual({
      "@type": "VideoObject",
      name: "Огляд камери",
      description: "Смартфон з дисплеєм 6,3 дюйма.",
      thumbnailUrl: ["https://cdn.shopify.com/poster.jpg"],
      contentUrl: "https://cdn.shopify.com/videos/c/vp/1/1.HD-1080p-7.2Mbps.mp4",
    });
    expect(data.subjectOf).not.toHaveProperty("uploadDate");
  });

  it("відео з YouTube описує через embedUrl; дата додається, лише коли її передали", () => {
    const video = {
      name: "Розпакування",
      thumbnailUrl: "https://cdn.shopify.com/poster.jpg",
      embedUrl: "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",
    };

    expect(productJsonLd({ ...PRODUCT, description: "", video }, ORIGIN).subjectOf).toEqual({
      "@type": "VideoObject",
      name: "Розпакування",
      thumbnailUrl: ["https://cdn.shopify.com/poster.jpg"],
      embedUrl: "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",
    });
    expect(
      productJsonLd({ ...PRODUCT, video: { ...video, uploadDate: "2026-09-01T10:00:00Z" } }, ORIGIN)
        .subjectOf,
    ).toMatchObject({ uploadDate: "2026-09-01T10:00:00Z" });
  });

  it("не додає VideoObject без відео, без обкладинки чи без адреси", () => {
    const noPoster = {
      name: "Відео",
      thumbnailUrl: "",
      contentUrl: "https://cdn.shopify.com/v.mp4",
    };
    const noSource = { name: "Відео", thumbnailUrl: "https://cdn.shopify.com/p.jpg" };

    expect(productJsonLd(PRODUCT, ORIGIN)).not.toHaveProperty("subjectOf");
    expect(productJsonLd({ ...PRODUCT, video: null }, ORIGIN)).not.toHaveProperty("subjectOf");
    expect(productJsonLd({ ...PRODUCT, video: noPoster }, ORIGIN)).not.toHaveProperty("subjectOf");
    expect(productJsonLd({ ...PRODUCT, video: noSource }, ORIGIN)).not.toHaveProperty("subjectOf");
  });

  it("пропускає порожні необов'язкові поля", () => {
    const data = productJsonLd(
      { ...PRODUCT, description: "", images: [], sku: null, brand: null },
      ORIGIN,
    );

    expect(data).not.toHaveProperty("description");
    expect(data).not.toHaveProperty("image");
    expect(data).not.toHaveProperty("sku");
    expect(data).not.toHaveProperty("brand");
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
  });
});

describe("breadcrumbListJsonLd", () => {
  it("нумерує позиції з 1 і будує абсолютні адреси", () => {
    const data = breadcrumbListJsonLd(
      [
        { title: "Головна", to: "/" },
        { title: "iPhone", to: "/collections/iphone" },
        { title: "iPhone 17 Pro", to: "/products/iphone-17-pro" },
      ],
      ORIGIN,
    );

    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Головна", item: "https://sad.example/" },
      {
        "@type": "ListItem",
        position: 2,
        name: "iPhone",
        item: "https://sad.example/collections/iphone",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "iPhone 17 Pro",
        item: "https://sad.example/products/iphone-17-pro",
      },
    ]);
  });
});
