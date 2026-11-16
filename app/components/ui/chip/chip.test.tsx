import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Chip } from "./chip";
import { chipVariants } from "./chip.variants";

const classesOf = (value: string) => value.split(/\s+/).filter(Boolean);

describe("Chip", () => {
  it("рендерить Badge зі своїм data-slot і варіантом chip", () => {
    render(<Chip>256 ГБ</Chip>);
    const chip = screen.getByText("256 ГБ");

    expect(chip.tagName).toBe("SPAN");
    expect(chip).toHaveAttribute("data-slot", "chip");
    expect(chip).toHaveAttribute("data-variant", "chip");
  });

  it.each(["page", "surface", "on-dark"] as const)(
    "тон %s має всі класи попереднього вигляду",
    (tone) => {
      render(<Chip tone={tone}>A19 Pro</Chip>);
      const chip = screen.getByText("A19 Pro");

      expect(chip).toHaveClass(...classesOf(chipVariants({ tone })));
      expect(chip).not.toHaveClass("h-6", "px-2", "font-semibold", "justify-center");
    },
  );

  it("className перекриває класи варіанта", () => {
    render(<Chip className="h-8">до 33 годин відео</Chip>);

    expect(screen.getByText("до 33 годин відео")).toHaveClass("h-8");
    expect(screen.getByText("до 33 годин відео")).not.toHaveClass("h-7");
  });
});
