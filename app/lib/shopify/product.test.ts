import { describe, expect, it } from "vitest";

import {
  externalVideoEmbedUrl,
  isColorOptionName,
  isHexColor,
  parseListMetafield,
  productColorSwatches,
  productGalleryImages,
  productGalleryMedia,
  productMetaDescription,
  productMetaTitle,
  productOgVideo,
  productVariantUrl,
  sortVideoSources,
  swatchKey,
  toProductDetails,
  toProductJsonLdInput,
  toProductMedia,
  type ProductPageData,
  type ProductPageMediaNode,
} from "./product";

const IMAGE_A = {
  id: "a",
  url: "https://cdn.shopify.com/a.png",
  altText: "A",
  width: 800,
  height: 800,
};
const IMAGE_B = {
  id: "b",
  url: "https://cdn.shopify.com/b.png",
  altText: "B",
  width: 800,
  height: 800,
};

const POSTER = {
  url: "https://cdn.shopify.com/poster.jpg",
  altText: null,
  width: 1920,
  height: 1080,
};

function mediaImage(
  image: typeof IMAGE_A,
): Extract<ProductPageMediaNode, { __typename: "MediaImage" }> {
  const { id, ...fields } = image;
  return {
    __typename: "MediaImage",
    id: `gid://shopify/MediaImage/${id}`,
    alt: image.altText,
    previewImage: fields,
    image: fields,
  };
}

const VIDEO = {
  __typename: "Video",
  id: "gid://shopify/Video/1",
  alt: "Огляд камери",
  previewImage: POSTER,
  sources: [
    {
      url: "https://cdn.shopify.com/videos/c/vp/1/1.SD-480p-1.5Mbps.mp4",
      mimeType: "video/mp4",
      format: "mp4",
      height: 480,
      width: 854,
    },
    {
      url: "https://cdn.shopify.com/videos/c/vp/1/1.HD-2160p.mp4",
      mimeType: "video/mp4",
      format: "mp4",
      height: 2160,
      width: 3840,
    },
    {
      url: "https://cdn.shopify.com/videos/c/vp/1/1.m3u8",
      mimeType: "application/x-mpegURL",
      format: "m3u8",
      height: 1080,
      width: 1920,
    },
    {
      url: "https://cdn.shopify.com/videos/c/vp/1/1.HD-1080p-7.2Mbps.mp4",
      mimeType: "video/mp4",
      format: "mp4",
      height: 1080,
      width: 1920,
    },
  ],
} satisfies ProductPageMediaNode;

const YOUTUBE = {
  __typename: "ExternalVideo",
  id: "gid://shopify/ExternalVideo/1",
  alt: null,
  previewImage: POSTER,
  host: "YOUTUBE",
  embedUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ",
  originUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
} satisfies ProductPageMediaNode;

const GLB = {
  url: "https://cdn.shopify.com/3d/models/o/1/case.glb",
  mimeType: "model/gltf-binary",
  format: "glb",
};
const USDZ = {
  url: "https://cdn.shopify.com/3d/models/o/1/case.usdz",
  mimeType: "model/vnd.usdz+zip",
  format: "usdz",
};

const MODEL = {
  __typename: "Model3d",
  id: "gid://shopify/Model3d/1",
  alt: "Модель корпусу",
  previewImage: POSTER,
  sources: [GLB, USDZ],
} satisfies ProductPageMediaNode;

function product(overrides: Partial<ProductPageData> = {}): ProductPageData {
  const base = {
    id: "gid://shopify/Product/1",
    handle: "iphone-17-pro",
    title: "iPhone 17 Pro",
    vendor: "Apple",
    description: "Смартфон з дисплеєм 6,3 дюйма.",
    descriptionHtml: "<p>Смартфон з дисплеєм 6,3 дюйма.</p>",
    availableForSale: true,
    requiresSellingPlan: false,
    encodedVariantExistence: null,
    encodedVariantAvailability: null,
    seo: { title: null, description: null },
    featuredImage: IMAGE_A,
    media: { nodes: [mediaImage(IMAGE_A), mediaImage(IMAGE_B)] },
    priceRange: { minVariantPrice: { amount: "64999.0", currencyCode: "UAH" } },
    collections: { nodes: [{ handle: "iphone", title: "iPhone" }] },
    options: [
      {
        name: "Пам'ять",
        optionValues: [
          { name: "256 ГБ", firstSelectableVariant: null, swatch: null },
          { name: "512 ГБ", firstSelectableVariant: null, swatch: null },
        ],
      },
      {
        name: "Колір",
        optionValues: [
          { name: "Синій титан", firstSelectableVariant: null, swatch: null },
          { name: "Срібний", firstSelectableVariant: null, swatch: { color: "#E3E4E5" } },
        ],
      },
    ],
    selectedOrFirstAvailableVariant: null,
    adjacentVariants: [],
    badge: null,
    installmentMonths: null,
    shortSpecs: null,
    colorSwatches: null,
    conditionGrade: null,
    batteryHealth: null,
  };

  return { ...base, ...overrides } as ProductPageData;
}

describe("parseListMetafield", () => {
  it("читає JSON-список і прибирає порожні значення", () => {
    expect(parseListMetafield('["Дисплей: 6,3″", " Face ID ", ""]')).toEqual([
      "Дисплей: 6,3″",
      "Face ID",
    ]);
  });

  it("розбиває звичайний текст за рядками", () => {
    expect(parseListMetafield("A18 Pro\nFace ID")).toEqual(["A18 Pro", "Face ID"]);
  });

  it("повертає порожній список без значення", () => {
    expect(parseListMetafield(null)).toEqual([]);
    expect(parseListMetafield("")).toEqual([]);
  });
});

describe("isHexColor", () => {
  it("приймає лише hex-кольори", () => {
    expect(isHexColor("#3c4a5e")).toBe(true);
    expect(isHexColor("#FFF")).toBe(true);
    expect(isHexColor("red")).toBe(false);
    expect(isHexColor("#12345")).toBe(false);
    expect(isHexColor("url(javascript:alert(1))")).toBe(false);
    expect(isHexColor(null)).toBe(false);
  });
});

describe("isColorOptionName", () => {
  it("розпізнає опцію кольору різними мовами", () => {
    expect(isColorOptionName("Колір")).toBe(true);
    expect(isColorOptionName("Colour")).toBe(true);
    expect(isColorOptionName("Color")).toBe(true);
    expect(isColorOptionName("Пам'ять")).toBe(false);
  });
});

describe("toProductDetails", () => {
  it("на магазині без метаполів усе порожнє", () => {
    expect(toProductDetails(product())).toEqual({
      badge: null,
      installmentMonths: null,
      shortSpecs: [],
      used: null,
      rating: null,
      collection: { handle: "iphone", title: "iPhone" },
    });
  });

  it("читає метаполя custom.*", () => {
    const details = toProductDetails(
      product({
        badge: { value: "Хіт" },
        installmentMonths: { value: "24" },
        shortSpecs: { value: '["A18 Pro","Face ID"]' },
        conditionGrade: { value: "Відмінний" },
        batteryHealth: { value: "91" },
        collections: { nodes: [] },
      }),
    );

    expect(details).toEqual({
      badge: "Хіт",
      installmentMonths: 24,
      shortSpecs: ["A18 Pro", "Face ID"],
      used: { grade: "Відмінний", batteryHealth: 91 },
      rating: null,
      collection: null,
    });
  });

  it("ігнорує невідомі значення бейджа та стану", () => {
    const details = toProductDetails(
      product({ badge: { value: "Sale" }, conditionGrade: { value: "Used" } }),
    );

    expect(details.badge).toBeNull();
    expect(details.used).toBeNull();
  });
});

describe("productColorSwatches", () => {
  it("бере swatch опції, а без нього — custom.color_swatches за порядком", () => {
    const swatches = productColorSwatches(
      product({ colorSwatches: { value: '["#3c4a5e","#000000"]' } }),
    );

    expect(swatches.get(swatchKey("Колір", "Синій титан"))).toBe("#3c4a5e");
    expect(swatches.get(swatchKey("Колір", "Срібний"))).toBe("#E3E4E5");
    expect(swatches.has(swatchKey("Пам'ять", "256 ГБ"))).toBe(false);
  });

  it("відкидає значення, які не є hex-кольором", () => {
    const swatches = productColorSwatches(product({ colorSwatches: { value: '["blue"]' } }));

    expect(swatches.has(swatchKey("Колір", "Синій титан"))).toBe(false);
  });
});

describe("productGalleryImages", () => {
  it("ставить фото вибраного варіанта першим і не повторює фото", () => {
    expect(productGalleryImages(product(), { image: IMAGE_B }).map((image) => image.url)).toEqual([
      IMAGE_B.url,
      IMAGE_A.url,
    ]);
  });

  it("без варіанта починає з головного фото", () => {
    expect(productGalleryImages(product(), null).map((image) => image.url)).toEqual([
      IMAGE_A.url,
      IMAGE_B.url,
    ]);
  });

  it("повертає порожній список, коли фото немає", () => {
    expect(productGalleryImages(product({ featuredImage: null, media: { nodes: [] } }))).toEqual(
      [],
    );
  });

  it("відео та 3D-моделі до списку фото не потрапляють", () => {
    const withVideo = product({ media: { nodes: [mediaImage(IMAGE_A), VIDEO, MODEL] } });

    expect(productGalleryImages(withVideo).map((image) => image.url)).toEqual([IMAGE_A.url]);
  });
});

describe("toProductMedia", () => {
  it("фото: бере image, а без нього — previewImage", () => {
    expect(toProductMedia(mediaImage(IMAGE_A))).toEqual({
      type: "image",
      id: "gid://shopify/MediaImage/a",
      alt: "A",
      image: { url: IMAGE_A.url, altText: "A", width: 800, height: 800 },
    });
    expect(toProductMedia({ ...mediaImage(IMAGE_A), image: null })).toMatchObject({
      type: "image",
      image: { url: IMAGE_A.url },
    });
    expect(toProductMedia({ ...mediaImage(IMAGE_A), image: null, previewImage: null })).toBeNull();
  });

  it("відео Shopify: джерела в порядку HLS → MP4 до 1080p → решта", () => {
    const media = toProductMedia(VIDEO);

    expect(media).toMatchObject({ type: "video", alt: "Огляд камери", poster: POSTER });
    expect(media?.type === "video" ? media.sources.map((source) => source.height) : []).toEqual([
      1080, 1080, 480, 2160,
    ]);
    expect(media?.type === "video" ? media.sources[0] : null).toEqual({
      url: "https://cdn.shopify.com/videos/c/vp/1/1.m3u8",
      mimeType: "application/x-mpegURL",
      width: 1920,
      height: 1080,
    });
  });

  it("відео без обкладинки лишається, без джерел — ні", () => {
    expect(toProductMedia({ ...VIDEO, previewImage: null })).toMatchObject({
      type: "video",
      poster: null,
    });
    expect(toProductMedia({ ...VIDEO, sources: [] })).toBeNull();
    expect(
      toProductMedia({
        ...VIDEO,
        sources: [{ ...VIDEO.sources[0], url: "http://insecure.example/video.mp4" }],
      }),
    ).toBeNull();
  });

  it("YouTube: адреса плеєра на youtube-nocookie.com", () => {
    expect(toProductMedia(YOUTUBE)).toEqual({
      type: "external-video",
      id: "gid://shopify/ExternalVideo/1",
      alt: null,
      poster: POSTER,
      host: "youtube",
      embedUrl: "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",
      originUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    });
  });

  it("Vimeo: адреса плеєра player.vimeo.com", () => {
    expect(
      toProductMedia({
        ...YOUTUBE,
        host: "VIMEO",
        embedUrl: "https://player.vimeo.com/video/76979871",
        originUrl: "https://vimeo.com/76979871",
      }),
    ).toMatchObject({
      type: "external-video",
      host: "vimeo",
      embedUrl: "https://player.vimeo.com/video/76979871",
    });
  });

  it("зовнішнє відео з невідомою адресою відкидається", () => {
    expect(
      toProductMedia({
        ...YOUTUBE,
        embedUrl: "https://evil.example/embed/aqz-KE-bpKQ",
        originUrl: "https://evil.example/watch?v=aqz-KE-bpKQ",
      }),
    ).toBeNull();
  });

  it("3D-модель: джерела та обкладинка; без джерел відкидається", () => {
    expect(toProductMedia(MODEL)).toEqual({
      type: "model",
      id: "gid://shopify/Model3d/1",
      alt: "Модель корпусу",
      poster: POSTER,
      sources: [GLB, USDZ],
    });
    expect(toProductMedia({ ...MODEL, sources: [] })).toBeNull();
  });

  it("без alt у медіа бере alt обкладинки", () => {
    expect(
      toProductMedia({
        ...VIDEO,
        alt: null,
        previewImage: { ...POSTER, altText: "Кадр із відео" },
      }),
    ).toMatchObject({ alt: "Кадр із відео" });
  });
});

describe("externalVideoEmbedUrl", () => {
  const YOUTUBE_EMBED = "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ";

  it("розпізнає різні адреси YouTube", () => {
    expect(
      externalVideoEmbedUrl("YOUTUBE", "https://www.youtube.com/embed/aqz-KE-bpKQ?rel=0"),
    ).toBe(YOUTUBE_EMBED);
    expect(externalVideoEmbedUrl("YOUTUBE", "https://youtu.be/aqz-KE-bpKQ")).toBe(YOUTUBE_EMBED);
    expect(externalVideoEmbedUrl("YOUTUBE", "https://m.youtube.com/watch?v=aqz-KE-bpKQ&t=3")).toBe(
      YOUTUBE_EMBED,
    );
    expect(externalVideoEmbedUrl("YOUTUBE", "https://www.youtube.com/shorts/aqz-KE-bpKQ")).toBe(
      YOUTUBE_EMBED,
    );
  });

  it("бере наступну адресу, коли перша не підходить", () => {
    expect(
      externalVideoEmbedUrl("YOUTUBE", "not a url", null, "https://youtu.be/aqz-KE-bpKQ"),
    ).toBe(YOUTUBE_EMBED);
  });

  it("зберігає ключ відео Vimeo «за посиланням»", () => {
    const expected = "https://player.vimeo.com/video/76979871?h=abc123def4";

    expect(externalVideoEmbedUrl("VIMEO", "https://vimeo.com/76979871/abc123def4")).toBe(expected);
    expect(externalVideoEmbedUrl("VIMEO", expected)).toBe(expected);
  });

  it("відкидає http, чужі хости та сторонній код в адресі", () => {
    const rejected = [
      ["YOUTUBE", "http://www.youtube.com/embed/aqz-KE-bpKQ"],
      ["YOUTUBE", "https://youtube.com.evil.example/embed/aqz-KE-bpKQ"],
      ["YOUTUBE", 'https://www.youtube.com/embed/"><script>'],
      ["YOUTUBE", "https://player.vimeo.com/video/76979871"],
      ["VIMEO", "javascript:alert(1)"],
      ["DAILYMOTION", "https://www.youtube.com/embed/aqz-KE-bpKQ"],
    ] as const;

    for (const [host, url] of rejected) expect(externalVideoEmbedUrl(host, url)).toBeNull();
  });
});

describe("sortVideoSources", () => {
  it("не змінює вхідний масив", () => {
    const sources = [
      { url: "a", mimeType: "video/mp4", height: 480 },
      { url: "b", mimeType: "video/mp4", height: 720 },
    ];

    expect(sortVideoSources(sources).map((source) => source.url)).toEqual(["b", "a"]);
    expect(sources.map((source) => source.url)).toEqual(["a", "b"]);
  });
});

describe("productGalleryMedia", () => {
  const mixed = () =>
    product({
      media: { nodes: [mediaImage(IMAGE_A), VIDEO, mediaImage(IMAGE_B), YOUTUBE, MODEL] },
    });

  it("зберігає порядок з адмінки й типи медіа", () => {
    expect(productGalleryMedia(mixed()).map((item) => item.type)).toEqual([
      "image",
      "video",
      "image",
      "external-video",
      "model",
    ]);
  });

  it("фото вибраного варіанта переходить на початок, решта лишається в порядку", () => {
    const media = productGalleryMedia(mixed(), { image: IMAGE_B });

    expect(media.map((item) => item.id)).toEqual([
      "gid://shopify/MediaImage/b",
      "gid://shopify/MediaImage/a",
      "gid://shopify/Video/1",
      "gid://shopify/ExternalVideo/1",
      "gid://shopify/Model3d/1",
    ]);
  });

  it("фото варіанта, якого немає серед медіа, додається першим", () => {
    const other = { ...IMAGE_A, id: "c", url: "https://cdn.shopify.com/c.png", altText: "C" };
    const media = productGalleryMedia(mixed(), { image: other });

    expect(media).toHaveLength(6);
    expect(media[0]).toEqual({
      type: "image",
      id: "image:https://cdn.shopify.com/c.png",
      alt: "C",
      image: { url: other.url, altText: "C", width: 800, height: 800 },
    });
  });

  it("товар лише з відео: головне фото попереду, відео далі", () => {
    const media = productGalleryMedia(product({ media: { nodes: [VIDEO] } }));

    expect(media.map((item) => item.type)).toEqual(["image", "video"]);
  });

  it("не повторює одне й те саме фото й пропускає медіа, які нема чим показати", () => {
    const media = productGalleryMedia(
      product({
        media: {
          nodes: [mediaImage(IMAGE_A), mediaImage(IMAGE_A), { ...VIDEO, sources: [] }],
        },
      }),
    );

    expect(media.map((item) => item.id)).toEqual(["gid://shopify/MediaImage/a"]);
  });

  it("без медіа й головного фото — порожній список", () => {
    expect(productGalleryMedia(product({ featuredImage: null, media: { nodes: [] } }))).toEqual([]);
  });
});

describe("productOgVideo", () => {
  it("дає найкращий MP4 відео Shopify, а не HLS", () => {
    expect(productOgVideo(product({ media: { nodes: [mediaImage(IMAGE_A), VIDEO] } }))).toEqual({
      url: "https://cdn.shopify.com/videos/c/vp/1/1.HD-1080p-7.2Mbps.mp4",
      mimeType: "video/mp4",
      width: 1920,
      height: 1080,
    });
  });

  it("для YouTube і товарів без відео — null", () => {
    expect(
      productOgVideo(product({ media: { nodes: [mediaImage(IMAGE_A), YOUTUBE] } })),
    ).toBeNull();
    expect(productOgVideo(product())).toBeNull();
  });
});

describe("toProductJsonLdInput", () => {
  it("перелічує всі фото й описує відео Shopify прямою адресою", () => {
    const input = toProductJsonLdInput(
      product({ media: { nodes: [mediaImage(IMAGE_A), VIDEO, mediaImage(IMAGE_B)] } }),
    );

    expect(input.images).toEqual([IMAGE_A.url, IMAGE_B.url]);
    expect(input.video).toEqual({
      name: "Огляд камери",
      thumbnailUrl: POSTER.url,
      contentUrl: "https://cdn.shopify.com/videos/c/vp/1/1.HD-1080p-7.2Mbps.mp4",
    });
  });

  it("відео з YouTube описує адресою плеєра, а назвою без alt стає назва товару", () => {
    const input = toProductJsonLdInput(
      product({ media: { nodes: [mediaImage(IMAGE_A), YOUTUBE] } }),
    );

    expect(input.video).toEqual({
      name: "iPhone 17 Pro",
      thumbnailUrl: POSTER.url,
      embedUrl: "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",
    });
  });

  it("без відео або без його обкладинки video порожнє", () => {
    expect(toProductJsonLdInput(product()).video).toBeNull();
    expect(
      toProductJsonLdInput(
        product({ media: { nodes: [mediaImage(IMAGE_A), { ...VIDEO, previewImage: null }] } }),
      ).video,
    ).toBeNull();
  });
});

describe("productVariantUrl", () => {
  const target = { handle: "iphone-17-pro", options: [{ name: "Storage" }, { name: "Color" }] };

  it("записує опції в параметри й зберігає сторонні параметри", () => {
    const url = productVariantUrl(
      target,
      [
        { name: "Storage", value: "256 GB" },
        { name: "Color", value: "Blue" },
      ],
      undefined,
      new URLSearchParams("ref=campaign&Color=Silver"),
    );
    const parsed = new URL(url, "https://sad.example");

    expect(parsed.pathname).toBe("/products/iphone-17-pro");
    expect(parsed.searchParams.get("ref")).toBe("campaign");
    expect(parsed.searchParams.get("Storage")).toBe("256 GB");
    expect(parsed.searchParams.getAll("Color")).toEqual(["Blue"]);
  });

  it("без вибраних опцій дає чисту адресу товару", () => {
    expect(productVariantUrl(target, [])).toBe("/products/iphone-17-pro");
  });

  it("для об'єднаних товарів підставляє handle іншого товару", () => {
    expect(productVariantUrl(target, [], "iphone-17")).toBe("/products/iphone-17");
  });
});

describe("productMetaTitle", () => {
  it("додає уточнення про магазин, доки вміщається в 60 символів", () => {
    expect(productMetaTitle("iPhone 17 Pro")).toBe(
      "iPhone 17 Pro — купити у Вінниці | Ionov Store",
    );
    expect(productMetaTitle("MacBook Air 13 M4 16/256 ГБ, 2025")).toBe(
      "MacBook Air 13 M4 16/256 ГБ, 2025 — купити | Ionov Store",
    );
  });

  it("ніколи не перевищує 60 символів", () => {
    const title = productMetaTitle(
      "Навушники Apple AirPods Max USB-C з активним шумопоглинанням, темна ніч",
    );

    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.endsWith("…")).toBe(true);
  });
});

describe("productMetaDescription", () => {
  it("до короткого опису додає умови магазину", () => {
    expect(productMetaDescription(product())).toBe(
      "Смартфон з дисплеєм 6,3 дюйма. Доставка по Україні завтра, оплата частинами, гарантія 12 місяців.",
    );
  });

  it("віддає перевагу SEO-опису та обрізає довгий текст", () => {
    const description = productMetaDescription(
      product({ seo: { title: null, description: "Дуже докладний опис товару. ".repeat(12) } }),
    );

    expect(description.startsWith("Дуже докладний опис товару.")).toBe(true);
    expect(description.length).toBeLessThanOrEqual(155);
    expect(description.endsWith("…")).toBe(true);
  });

  it("без опису складає текст із назви", () => {
    expect(productMetaDescription(product({ description: "" }))).toContain(
      "Купити iPhone 17 Pro в Ionov Store.",
    );
  });
});
