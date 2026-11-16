import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IconTile } from "./icon-tile";
import { iconTileVariants } from "./icon-tile.variants";

const classesOf = (value: string) => value.split(/\s+/).filter(Boolean);

describe("IconTile", () => {
  it("лишається декоративним <span> зі своїм data-slot", () => {
    render(<IconTile data-testid="tile" />);
    const tile = screen.getByTestId("tile");

    expect(tile.tagName).toBe("SPAN");
    expect(tile).toHaveAttribute("data-slot", "icon-tile");
    expect(tile).toHaveAttribute("aria-hidden", "true");
  });

  it.each([
    { size: "md", tone: "light" },
    { size: "lg", tone: "light" },
    { size: "md", tone: "dark" },
    { size: "lg", tone: "dark" },
  ] as const)("$size $tone має всі класи попереднього вигляду", ({ size, tone }) => {
    render(<IconTile size={size} tone={tone} data-testid="tile" />);

    expect(screen.getByTestId("tile")).toHaveClass(...classesOf(iconTileVariants({ size, tone })));
  });

  it("className перекриває класи варіанта", () => {
    render(<IconTile className="size-14 bg-surface" data-testid="tile" />);
    const tile = screen.getByTestId("tile");

    expect(tile).toHaveClass("size-14", "bg-surface");
    expect(tile).not.toHaveClass("size-11", "bg-page");
  });
});
