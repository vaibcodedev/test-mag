import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("за замовчуванням це primary md із type=button", () => {
    render(<Button>Купити</Button>);
    const button = screen.getByRole("button", { name: "Купити" });

    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("data-variant", "primary");
    expect(button).toHaveAttribute("data-size", "md");
    expect(button).toHaveClass("bg-blue", "h-11.5");
  });

  it("викликає onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Купити</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Купити" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("у стані loading показує спінер і позначає aria-busy", () => {
    render(<Button loading>Купити</Button>);

    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status", { name: "Завантаження" })).toBeInTheDocument();
  });

  it("disabled блокує натискання", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Купити
      </Button>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Купити" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("asChild переносить стилі на посилання", () => {
    render(
      <Button asChild variant="secondary">
        <a href="/collections/iphone">Усі iPhone</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Усі iPhone" });

    expect(link).toHaveClass("bg-page");
    expect(link).toHaveAttribute("href", "/collections/iphone");
  });

  it("className перекриває класи варіанта", () => {
    render(<Button className="h-14 w-full">Купити</Button>);
    const button = screen.getByRole("button");

    expect(button).toHaveClass("h-14", "w-full");
    expect(button).not.toHaveClass("h-11.5");
  });
});
