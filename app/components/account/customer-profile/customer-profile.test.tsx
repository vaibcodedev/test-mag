import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { customerFullName, customerGreeting, customerInitials } from "./customer-identity";
import { CustomerProfile } from "./customer-profile";

describe("customerInitials", () => {
  it("бере перші літери імені та прізвища", () => {
    expect(customerInitials("Олена", "Коваль")).toBe("ОК");
    expect(customerInitials("  єва ", "ґудзь")).toBe("ЄҐ");
  });

  it("з одним лише іменем чи прізвищем дає одну літеру", () => {
    expect(customerInitials("Олена", null)).toBe("О");
    expect(customerInitials("", "Коваль", "x@example.com")).toBe("К");
  });

  it("без імені бере першу літеру пошти, пропускаючи розділові знаки", () => {
    expect(customerInitials(null, null, "olena@example.com")).toBe("O");
    expect(customerInitials(" ", undefined, "_7days@example.com")).toBe("7");
  });

  it("без даних повертає порожній рядок", () => {
    expect(customerInitials(null, null, null)).toBe("");
    expect(customerInitials("", "", "@")).toBe("");
  });
});

describe("customerGreeting і customerFullName", () => {
  it("вітає на ім'я, а без нього — нейтрально", () => {
    expect(customerGreeting(" Олена ")).toBe("Вітаємо, Олена!");
    expect(customerGreeting(null)).toBe("Вітаємо в кабінеті!");
    expect(customerGreeting("   ")).toBe("Вітаємо в кабінеті!");
  });

  it("збирає повне ім'я з того, що є", () => {
    expect(customerFullName("Олена", "Коваль")).toBe("Олена Коваль");
    expect(customerFullName(null, " Коваль ")).toBe("Коваль");
    expect(customerFullName(undefined, "")).toBe("");
  });
});

describe("CustomerProfile", () => {
  it("показує привітання як h1, ім'я з поштою та дії", () => {
    const { container } = render(
      <CustomerProfile
        firstName="Олена"
        lastName="Коваль"
        email="olena@example.com"
        actions={<button type="button">Вийти</button>}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Вітаємо, Олена!" })).toBeVisible();
    expect(screen.getByText("Олена Коваль")).toBeInTheDocument();
    expect(screen.getByText("olena@example.com")).toBeInTheDocument();
    expect(container.querySelector('[data-slot="avatar"]')).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("button", { name: "Вийти" })).toBeInTheDocument();
  });

  it("без імені лишає пошту й нейтральне привітання", () => {
    const { container } = render(<CustomerProfile email="olena@example.com" />);

    expect(screen.getByRole("heading", { level: 1, name: "Вітаємо в кабінеті!" })).toBeVisible();
    expect(container.querySelector('[data-slot="customer-name"]')).toBeNull();
    expect(screen.getByText("olena@example.com")).toBeInTheDocument();
  });
});
