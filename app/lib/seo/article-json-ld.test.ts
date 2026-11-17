import { describe, expect, it } from "vitest";

import { articleJsonLd } from "./article-json-ld";
import { contentMeta, metaTitle, truncateText } from "./content-meta";

const ORIGIN = "https://sad.example";

describe("articleJsonLd", () => {
  it("будує Article з абсолютною адресою, датами й видавцем", () => {
    const node = articleJsonLd(
      {
        path: "/blogs/blog/yakyi-iphone",
        title: "Який iPhone купити",
        description: "Порівнюємо моделі.",
        image: "https://cdn.shopify.com/a.png",
        publishedAt: "2026-11-10T09:00:00+02:00",
        authorName: "Олег Іонов",
        wordCount: 420,
      },
      `${ORIGIN}/`,
    );

    expect(node).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${ORIGIN}/blogs/blog/yakyi-iphone#article`,
      headline: "Який iPhone купити",
      url: `${ORIGIN}/blogs/blog/yakyi-iphone`,
      mainEntityOfPage: `${ORIGIN}/blogs/blog/yakyi-iphone`,
      inLanguage: "uk-UA",
      datePublished: "2026-11-10T09:00:00+02:00",
      dateModified: "2026-11-10T09:00:00+02:00",
      description: "Порівнюємо моделі.",
      image: ["https://cdn.shopify.com/a.png"],
      wordCount: 420,
      author: { "@type": "Person", name: "Олег Іонов" },
      publisher: { "@id": `${ORIGIN}/#organization` },
    });
  });

  it("без автора, фото й опису не додає порожніх полів; автор — організація", () => {
    const node = articleJsonLd(
      { path: "/blogs/blog/a", title: "A", publishedAt: "2026-01-01T00:00:00Z" },
      ORIGIN,
    );

    expect(node).not.toHaveProperty("image");
    expect(node).not.toHaveProperty("description");
    expect(node).not.toHaveProperty("wordCount");
    expect(node.author).toEqual({ "@id": `${ORIGIN}/#organization` });
  });

  it("бере окрему дату зміни, якщо вона є", () => {
    const node = articleJsonLd(
      {
        path: "/blogs/blog/a",
        title: "A",
        publishedAt: "2026-01-01T00:00:00Z",
        modifiedAt: "2026-02-01T00:00:00Z",
      },
      ORIGIN,
    );

    expect(node.dateModified).toBe("2026-02-01T00:00:00Z");
  });
});

describe("metaTitle", () => {
  it("додає назву магазину, коли вміщається у 60 символів", () => {
    expect(metaTitle("Гарантія")).toBe("Гарантія — Ionov Store");
  });

  it("довгий заголовок обрізає до 60 символів по межі слова", () => {
    const title = metaTitle(
      "Як перевірити вживаний iPhone перед покупкою: повний список із дванадцяти кроків",
    );

    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.endsWith("…")).toBe(true);
    expect(title).not.toContain(" …");
  });
});

describe("truncateText", () => {
  it("короткий текст лишає як є, а пробіли згортає", () => {
    expect(truncateText("  два   слова ", 20)).toBe("два слова");
  });
});

describe("contentMeta", () => {
  it("віддає title, description, canonical і Open Graph", () => {
    const meta = contentMeta({
      title: "Гарантія",
      description: "Опис сторінки.",
      path: "/pages/warranty",
      origin: ORIGIN,
    });

    expect(meta).toContainEqual({ title: "Гарантія — Ionov Store" });
    expect(meta).toContainEqual({ name: "description", content: "Опис сторінки." });
    expect(meta).toContainEqual({
      tagName: "link",
      rel: "canonical",
      href: `${ORIGIN}/pages/warranty`,
    });
    expect(meta).toContainEqual({ property: "og:type", content: "website" });
    expect(meta).toContainEqual({ property: "og:url", content: `${ORIGIN}/pages/warranty` });
    expect(meta.some((tag) => "name" in tag && tag.name === "robots")).toBe(false);
  });

  it("для статті додає og:image і дату, для noindex — robots", () => {
    const meta = contentMeta({
      title: "Стаття",
      description: "Опис.",
      path: "/blogs/blog/a",
      origin: ORIGIN,
      type: "article",
      image: "https://cdn.shopify.com/a.png",
      publishedAt: "2026-01-01T00:00:00Z",
      noindex: true,
    });

    expect(meta).toContainEqual({ property: "og:type", content: "article" });
    expect(meta).toContainEqual({ property: "og:image", content: "https://cdn.shopify.com/a.png" });
    expect(meta).toContainEqual({
      property: "article:published_time",
      content: "2026-01-01T00:00:00Z",
    });
    expect(meta).toContainEqual({ name: "robots", content: "noindex, follow" });
  });
});
