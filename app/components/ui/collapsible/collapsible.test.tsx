import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";

describe("Collapsible", () => {
  it("відкриває і закриває вміст", async () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Усі характеристики</CollapsibleTrigger>
        <CollapsibleContent>Камера 48 Мп</CollapsibleContent>
      </Collapsible>,
    );
    const trigger = screen.getByRole("button", { name: "Усі характеристики" });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Камера 48 Мп")).not.toBeInTheDocument();

    await userEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Камера 48 Мп")).toBeInTheDocument();

    await userEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("із forceMount тримає закритий вміст у DOM і ховає його класом", async () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Умови доставки</CollapsibleTrigger>
        <CollapsibleContent forceMount>Самовивіз із шоуруму</CollapsibleContent>
      </Collapsible>,
    );
    const content = screen.getByText("Самовивіз із шоуруму");

    expect(content).toHaveAttribute("data-state", "closed");
    expect(content).toHaveClass("data-closed:hidden");

    await userEvent.click(screen.getByRole("button", { name: "Умови доставки" }));

    expect(content).toHaveAttribute("data-state", "open");
  });
});
