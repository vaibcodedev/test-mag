import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { SeoBlock } from "./seo-block";
import {
  SEO_BLOCK_DEMO_BUYER_LINKS,
  SEO_BLOCK_DEMO_MODELS,
  SEO_BLOCK_DEMO_PARAGRAPHS,
  SEO_BLOCK_DEMO_QUERIES,
  SEO_BLOCK_DEMO_TITLE,
} from "./seo-block.demo";

const block = (
  <MemoryRouter>
    <SeoBlock
      title={SEO_BLOCK_DEMO_TITLE}
      paragraphs={SEO_BLOCK_DEMO_PARAGRAPHS}
      popularModels={SEO_BLOCK_DEMO_MODELS}
      buyerLinks={SEO_BLOCK_DEMO_BUYER_LINKS}
      popularQueries={SEO_BLOCK_DEMO_QUERIES}
    />
  </MemoryRouter>
);

describe("SeoBlock", () => {
  it("увесь текст є в серверному HTML", () => {
    const page = document.createElement("div");
    page.innerHTML = renderToString(block);

    for (const paragraph of SEO_BLOCK_DEMO_PARAGRAPHS) {
      expect(page.textContent).toContain(paragraph);
    }
  });

  it("увесь текст є в DOM, поки блок згорнутий", () => {
    const { container } = render(block);
    const text = container.querySelector('[data-slot="seo-text"]');

    expect(screen.getByRole("button", { name: "Читати далі" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(text).toHaveAttribute("data-state", "closed");
    for (const paragraph of SEO_BLOCK_DEMO_PARAGRAPHS) {
      expect(text).toContainElement(screen.getByText(paragraph));
    }
  });

  it("згорнутий текст обрізаний по висоті, а не прихований", () => {
    const { container } = render(block);
    const text = container.querySelector('[data-slot="seo-text"]');

    // Обрізає вкладений блок: саме на ньому висота змінюється плавно.
    expect(text?.querySelector('[data-slot="seo-text-clip"]')).toHaveClass(
      "overflow-hidden",
      "transition-[max-height]",
      "[[data-state=closed]>&]:max-h-[6lh]",
    );
    expect(text).toHaveClass("data-closed:block");
    expect(text).not.toHaveClass("data-closed:hidden");
    expect(text).not.toHaveAttribute("hidden");
    expect(text).not.toHaveAttribute("aria-hidden");
  });

  it("«Читати далі» розгортає текст і стає «Згорнути»: мишею та з клавіатури", async () => {
    const user = userEvent.setup();
    const { container } = render(block);
    const text = container.querySelector('[data-slot="seo-text"]');
    const toggle = screen.getByRole("button", { name: "Читати далі" });

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute("aria-controls", text?.id);
    expect(toggle).toHaveAccessibleName("Згорнути");
    expect(text).toHaveAttribute("data-state", "open");

    toggle.focus();
    await user.keyboard(" ");

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAccessibleName("Читати далі");
    expect(text).toHaveAttribute("data-state", "closed");
    for (const paragraph of SEO_BLOCK_DEMO_PARAGRAPHS) {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    }
  });

  it("має один h2 і три списки посилань", () => {
    render(block);

    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    expect(screen.getByRole("navigation", { name: "Популярні моделі" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Покупцям" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Популярні запити" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "купити iPhone у Вінниці" })).toHaveAttribute(
      "href",
      "/collections/iphone",
    );
  });
});
