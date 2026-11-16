import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Rating } from "./rating";

describe("Rating", () => {
  it("озвучує оцінку з комою та кількість відгуків у правильній формі", () => {
    render(<Rating value={4.9} count={128} />);

    expect(screen.getByRole("img", { name: "Оцінка 4,9 з 5, 128 відгуків" })).toBeInTheDocument();
  });

  it("працює без кількості відгуків", () => {
    render(<Rating value={5} />);

    expect(screen.getByRole("img", { name: "Оцінка 5,0 з 5" })).toBeInTheDocument();
  });

  it("обмежує значення діапазоном 0–5", () => {
    render(<Rating value={7} count={1} />);

    expect(screen.getByRole("img", { name: "Оцінка 5,0 з 5, 1 відгук" })).toBeInTheDocument();
  });

  it("малює п'ять зірок, а в compact — одну", () => {
    const { container, rerender } = render(<Rating value={4} />);
    expect(container.querySelectorAll("svg")).toHaveLength(5);
    expect(container.querySelectorAll("svg.fill-star")).toHaveLength(4);

    rerender(<Rating value={4} variant="compact" />);
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });
});
