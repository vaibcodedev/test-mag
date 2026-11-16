import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { Faq } from "./faq";
import { FAQ_DEMO_ITEMS } from "./faq.demo";

const faq = (
  <MemoryRouter>
    <Faq items={FAQ_DEMO_ITEMS} />
  </MemoryRouter>
);

const [FIRST, SECOND] = FAQ_DEMO_ITEMS;
if (!FIRST || !SECOND) throw new Error("Замало демо-запитань");

/** Блок відповіді Accordion, у якому лежить текст. */
function answerPanel(answer: string): HTMLElement {
  const panel = screen
    .getByText((_, element) => element?.textContent === answer && element.children.length === 0)
    .closest<HTMLElement>('[data-slot="accordion-content"]');
  if (!panel) throw new Error("Відповідь не в AccordionContent");
  return panel;
}

describe("Faq", () => {
  it("має один h2, а кожне питання — h3 з кнопкою розгортання", () => {
    render(faq);

    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: "Часті запитання" })).toHaveAttribute(
      "id",
      "faq-title",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(FAQ_DEMO_ITEMS.length);
    for (const item of FAQ_DEMO_ITEMS) {
      const heading = screen.getByRole("heading", { level: 3, name: item.question });
      const trigger = screen.getByRole("button", { name: item.question });

      expect(heading).toContainElement(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("усі відповіді є в серверному HTML", () => {
    const html = renderToString(faq);
    const page = document.createElement("div");
    page.innerHTML = html;

    for (const item of FAQ_DEMO_ITEMS) {
      expect(page.textContent).toContain(item.answer);
    }
  });

  it("усі відповіді є в DOM, поки блоки згорнуті, і сховані класом", () => {
    render(faq);

    for (const item of FAQ_DEMO_ITEMS) {
      const panel = answerPanel(item.answer);
      const row = panel.closest('[data-slot="card"]');

      expect(panel).toHaveAttribute("data-state", "closed");
      expect(panel).not.toHaveAttribute("hidden");
      expect(row).toHaveAttribute("data-state", "closed");
      // Закриту відповідь ховає сам AccordionContent (forceMount у базі).
      expect(panel).toHaveClass("data-closed:hidden");
      expect(panel.parentElement).toBe(row);
    }
  });

  it("клік відкриває відповідь, другий клік закриває; можна відкрити кілька одразу", async () => {
    const user = userEvent.setup();
    render(faq);
    const first = screen.getByRole("button", { name: FIRST.question });
    const second = screen.getByRole("button", { name: SECOND.question });

    await user.click(first);

    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(answerPanel(FIRST.answer)).toHaveAttribute("data-state", "open");
    expect(screen.getByRole("region", { name: FIRST.question })).toHaveTextContent(
      FIRST.answer.replace(/\s+/g, " "),
    );
    expect(answerPanel(SECOND.answer)).toHaveAttribute("data-state", "closed");

    await user.click(second);

    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(second).toHaveAttribute("aria-expanded", "true");

    await user.click(first);

    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(answerPanel(FIRST.answer)).toHaveAttribute("data-state", "closed");
    expect(second).toHaveAttribute("aria-expanded", "true");
  });

  it("розгортається з клавіатури, а кнопка — ціль від 44px із видимим фокусом", async () => {
    const user = userEvent.setup();
    render(faq);
    const first = screen.getByRole("button", { name: FIRST.question });

    expect(first).toHaveClass("min-h-14", "focus-ring");

    first.focus();
    await user.keyboard("{Enter}");

    expect(first).toHaveAttribute("aria-expanded", "true");
  });
});
