import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { ContentBodyView, ContentSections } from "./content-body";
import { demoteHeadings, RichText } from "./rich-text";

type Flagged = typeof globalThis & { __richTextXss?: boolean };

const SHOPIFY_HTML = `
  <h2>Умови доставки</h2>
  <p>Відправляємо <a href="/pages/delivery">Новою поштою</a>.</p>
  <ul><li>Відділення</li><li>Поштомат</li></ul>
  <table><thead><tr><th>Спосіб</th></tr></thead><tbody><tr><td>Кур'єр</td></tr></tbody></table>
  <blockquote>Цитата</blockquote>
  <img src="https://cdn.shopify.com/a.png" alt="Фото">
`;

afterEach(() => {
  delete (globalThis as Flagged).__richTextXss;
});

describe("RichText", () => {
  it("рендерить HTML із Shopify як розмітку, а не як текст", () => {
    render(<RichText html={SHOPIFY_HTML} />);

    expect(screen.getByRole("heading", { level: 2, name: "Умови доставки" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Новою поштою" })).toHaveAttribute(
      "href",
      "/pages/delivery",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Фото" })).toBeInTheDocument();
  });

  it("скрипт із вмісту не виконується: HTML вставляється через innerHTML", () => {
    const { container } = render(
      <RichText html={`<p>Текст</p><script>globalThis.__richTextXss = true;</script>`} />,
    );

    expect(screen.getByText("Текст")).toBeInTheDocument();
    // Тег лишається в DOM (вміст власника магазину не переписуємо), але браузер його не запускає.
    expect(container.querySelector("script")).not.toBeNull();
    expect((globalThis as Flagged).__richTextXss).toBeUndefined();
  });

  it("зайвий h1 з адмінки стає h2, щоб на сторінці лишився один h1", () => {
    render(<RichText html={`<h1 class="x">Заголовок</h1><p>Текст</p>`} />);

    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(screen.getByRole("heading", { level: 2, name: "Заголовок" })).toHaveClass("x");
  });

  it("без html стилізує children тим самим контейнером", () => {
    const { container } = render(
      <RichText className="extra">
        <p>Абзац</p>
      </RichText>,
    );
    const root = container.querySelector('[data-slot="rich-text"]');

    expect(root).toHaveClass("extra", "text-body");
    expect(screen.getByText("Абзац")).toBeInTheDocument();
  });

  it("на сервері віддає HTML у розмітці: текст видно без JavaScript", () => {
    const markup = renderToStaticMarkup(<RichText html="<p>Серверний текст</p>" />);

    expect(markup).toContain("<p>Серверний текст</p>");
  });
});

describe("demoteHeadings", () => {
  it("змінює лише теги h1 і не чіпає схожі слова", () => {
    expect(demoteHeadings("<h1>A</h1><H1 id='b'>B</H1><h10>C</h10><p>h1</p>")).toBe(
      "<h2>A</h2><h2 id='b'>B</h2><h10>C</h10><p>h1</p>",
    );
  });
});

describe("ContentSections", () => {
  const sections = [
    {
      heading: "Строки гарантії",
      blocks: [
        { type: "paragraph" as const, text: "Гарантія 12 місяців." },
        { type: "list" as const, items: ["Нова техніка", "Вживана техніка"] },
        { type: "list" as const, ordered: true, items: ["Крок один"] },
      ],
    },
  ];

  it("рендерить заголовки, абзаци й списки; текст із даних екранується", () => {
    const { container } = render(
      <ContentSections
        sections={[
          ...sections,
          { heading: "<b>Не тег</b>", blocks: [{ type: "paragraph", text: "<script>x</script>" }] },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Строки гарантії" })).toBeInTheDocument();
    expect(screen.getByText("Гарантія 12 місяців.")).toBeInTheDocument();
    expect(container.querySelectorAll("ul > li")).toHaveLength(2);
    expect(container.querySelectorAll("ol > li")).toHaveLength(1);
    expect(screen.getByText("<script>x</script>")).toBeInTheDocument();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
  });

  it("ContentBodyView обирає спосіб показу за типом вмісту", () => {
    const { rerender } = render(<ContentBodyView body={{ kind: "sections", sections }} />);
    expect(screen.getByText("Гарантія 12 місяців.")).toBeInTheDocument();

    rerender(<ContentBodyView body={{ kind: "html", html: "<p>З магазину</p>" }} />);
    expect(screen.getByText("З магазину")).toBeInTheDocument();
  });
});
