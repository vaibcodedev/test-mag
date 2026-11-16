import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { ArticleHeader, readingTimeLabel } from "~/components/content/article-header";
import { calendarDate } from "~/lib/format";
import type { ArticleCardData } from "~/components/home/articles";

import { ArticleCard, type ArticleCardProps } from "./article-card";

const ARTICLE: ArticleCardData = {
  handle: "yakyi-iphone",
  title: "Який iPhone купити",
  excerpt: "Порівнюємо шість моделей.",
  image: { url: "https://cdn.shopify.com/a.png", altText: "iPhone", width: 928, height: 1152 },
  publishedAt: "2026-11-10T23:30:00+02:00",
};

function renderCard(props: Partial<ArticleCardProps> = {}) {
  return render(
    <MemoryRouter>
      <ArticleCard article={ARTICLE} {...props} />
    </MemoryRouter>,
  );
}

describe("ArticleCard", () => {
  it("показує фото, дату, заголовок-посилання й уривок", () => {
    renderCard();

    expect(screen.getByRole("link", { name: ARTICLE.title })).toHaveAttribute(
      "href",
      "/blogs/blog/yakyi-iphone",
    );
    expect(screen.getByRole("heading", { level: 3, name: ARTICLE.title })).toBeInTheDocument();
    expect(screen.getByText("10 листопада 2026 р.")).toHaveAttribute("datetime", "2026-11-10");
    expect(screen.getByText(ARTICLE.excerpt)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "iPhone" })).toHaveAttribute("loading", "lazy");
  });

  it("будує адресу від handle блогу, міняє рівень заголовка та пріоритет фото", () => {
    renderCard({ blogHandle: "news", headingLevel: "h2", priority: true });

    expect(screen.getByRole("link", { name: ARTICLE.title })).toHaveAttribute(
      "href",
      "/blogs/news/yakyi-iphone",
    );
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "iPhone" })).toHaveAttribute("loading", "eager");
  });

  it("без фото й уривка не лишає порожніх елементів", () => {
    const { container } = renderCard({ article: { ...ARTICLE, image: null, excerpt: "" } });

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });
});

describe("ArticleHeader", () => {
  it("має h1, дату, час читання та головне фото з пріоритетом", () => {
    render(
      <ArticleHeader
        title={ARTICLE.title}
        publishedAt={ARTICLE.publishedAt}
        readingMinutes={3}
        authorName="Олег"
        image={ARTICLE.image}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: ARTICLE.title })).toBeInTheDocument();
    expect(screen.getByText("3 хвилини читання")).toBeInTheDocument();
    expect(screen.getByText("Олег")).toBeInTheDocument();
    const image = screen.getByRole("img", { name: "iPhone" });
    expect(image).toHaveAttribute("loading", "eager");
    expect(image).toHaveAttribute("fetchpriority", "high");
  });
});

describe("readingTimeLabel", () => {
  it("узгоджує слово з числом", () => {
    expect(readingTimeLabel(1)).toBe("1 хвилина читання");
    expect(readingTimeLabel(2)).toBe("2 хвилини читання");
    expect(readingTimeLabel(5)).toBe("5 хвилин читання");
    expect(readingTimeLabel(21)).toBe("21 хвилина читання");
  });
});

describe("calendarDate", () => {
  it("бере день із самого рядка, незалежно від часового поясу", () => {
    expect(calendarDate("2026-11-10T23:30:00+02:00")?.dateTime).toBe("2026-11-10");
    expect(calendarDate("2026-01-01T00:30:00Z")?.date.getDate()).toBe(1);
    expect(calendarDate("не дата")).toBeNull();
  });
});
