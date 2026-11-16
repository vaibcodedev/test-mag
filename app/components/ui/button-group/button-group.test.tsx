import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

import { ButtonGroup } from "./button-group";

const MIN_QUANTITY = 1;

function QuantityStepper() {
  const [quantity, setQuantity] = useState(MIN_QUANTITY);

  return (
    <ButtonGroup aria-label="Кількість">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Зменшити кількість"
        disabled={quantity <= MIN_QUANTITY}
        onClick={() => setQuantity((value) => value - 1)}
      >
        −
      </Button>
      <Input
        aria-label="Кількість товару"
        inputMode="numeric"
        value={quantity}
        onChange={(event) => setQuantity(Number(event.target.value) || MIN_QUANTITY)}
      />
      <Button
        variant="ghost"
        size="icon"
        aria-label="Збільшити кількість"
        onClick={() => setQuantity((value) => value + 1)}
      >
        +
      </Button>
    </ButtonGroup>
  );
}

describe("ButtonGroup", () => {
  it("це група з підписом і спільним контуром", () => {
    render(<QuantityStepper />);
    const group = screen.getByRole("group", { name: "Кількість" });

    expect(group).toHaveAttribute("data-orientation", "horizontal");
    expect(group).toHaveClass("rounded-md", "h-11.5", "[&>*]:border");
  });

  it("лічильник кількості: плюс і мінус змінюють число в полі", async () => {
    render(<QuantityStepper />);
    const input = screen.getByRole("textbox", { name: "Кількість товару" });
    const minus = screen.getByRole("button", { name: "Зменшити кількість" });
    const plus = screen.getByRole("button", { name: "Збільшити кількість" });

    expect(input).toHaveValue("1");
    expect(minus).toBeDisabled();

    await userEvent.click(plus);
    await userEvent.click(plus);

    expect(input).toHaveValue("3");
    expect(minus).toBeEnabled();

    await userEvent.click(minus);

    expect(input).toHaveValue("2");
  });

  it("vertical складає елементи стовпчиком", () => {
    render(
      <ButtonGroup orientation="vertical" aria-label="Масштаб">
        <Button variant="ghost">Збільшити</Button>
        <Button variant="ghost">Зменшити</Button>
      </ButtonGroup>,
    );

    expect(screen.getByRole("group", { name: "Масштаб" })).toHaveClass("flex-col");
    expect(screen.getByRole("group", { name: "Масштаб" })).not.toHaveClass("h-11.5");
  });
});
